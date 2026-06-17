import React, { useEffect, useState } from 'react';
import { Listing } from '../../types';
import { BALI_DISTRICTS } from '../../data';
import { LISTINGS_COLLECTION, deleteDocument, setDocument, uploadFileToStorage } from '../../firebase';
import { DEFAULT_ADMIN_USERS, DEFAULT_TICKETS } from './mockData';
import { normalizeHousingListingForImport } from './importListingNormalizer';
import { AdminDashboardProps, AdminTab, AdminUser, SupportTicket } from './types';
import { uniqueDocumentIdFromTitle } from '../../utils/documentIds';

type AdminDashboardControllerParams = Pick<
  AdminDashboardProps,
  'listings' | 'onToggleStatus' | 'onUpdateListing' | 'onDeleteListing' | 'menuOverrides' | 'onUpdateMenuOverrides'
>;

export function useAdminDashboardController({
  listings,
  onToggleStatus,
  onUpdateListing,
  onDeleteListing,
  menuOverrides = { l1: {}, l2: {} },
  onUpdateMenuOverrides,
}: AdminDashboardControllerParams) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Admin tables dynamic states
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  
  // Configurations states
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [siteName, setSiteName] = useState<string>('Bali Base');
  const [telegramSupportLink, setTelegramSupportLink] = useState<string>('https://t.me/balibase_support');

  // Menu Customization States
  const [wizardLevel, setWizardLevel] = useState<1 | 2>(1);
  const [l1SelectedId, setL1SelectedId] = useState<string>('housing');
  const [l1Label, setL1Label] = useState<string>('');
  const [l1Desc, setL1Desc] = useState<string>('');
  const [l1Image, setL1Image] = useState<string>('');
  
  const [l2ParentId, setL2ParentId] = useState<string>('housing');
  const [l2SelectedId, setL2SelectedId] = useState<string>('entire_place');
  const [l2Label, setL2Label] = useState<string>('');
  const [l2Icon, setL2Icon] = useState<string>('');
  const [l2CustomImage, setL2CustomImage] = useState<string>('');
  const [l2IconType, setL2IconType] = useState<'emoji' | 'image'>('emoji');
  
  const [uploadMethod, setUploadMethod] = useState<'storage' | 'base64'>('storage');
  const [isMenuSaving, setIsMenuSaving] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [jsonImportCollection, setJsonImportCollection] = useState<string>(LISTINGS_COLLECTION);
  const [jsonImportFileName, setJsonImportFileName] = useState<string>('');
  const [jsonImportSummary, setJsonImportSummary] = useState<string>('');
  const [isJsonImporting, setIsJsonImporting] = useState<boolean>(false);

  const extractHousingListingsFromJson = (payload: any): Listing[] => {
    const source = payload?.[LISTINGS_COLLECTION] ?? payload?.listings ?? payload;
    let rows: any[] = [];

    if (Array.isArray(source)) {
      rows = source;
    } else if (source && typeof source === 'object') {
      rows = Object.entries(source).map(([id, value]) => ({
        ...(value && typeof value === 'object' ? value : {}),
        id: (value as any)?.id || id
      }));
    }

    if (!rows.length) {
      throw new Error(`В JSON не найдены объявления для ${LISTINGS_COLLECTION}`);
    }

    return rows.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Строка ${index + 1}: объект объявления поврежден`);
      }
      if (item.category && item.category !== 'housing') {
        throw new Error(`Строка ${index + 1}: category должен быть housing`);
      }
      return normalizeHousingListingForImport(item, index);
    });
  };

  const parseCsvRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell.trim());
        if (row.some(value => value.length > 0)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(value => value.length > 0)) rows.push(row);
    return rows;
  };

  const coerceCsvValue = (key: string, value: string): any => {
    if (!value) return undefined;
    if (['images', 'photos', 'imageUrls', 'amenities', 'extraOptions', 'bathroomOptions', 'blockedDates'].includes(key)) {
      return value.split(/[;|]/).map(item => item.trim()).filter(Boolean);
    }
    if (['isApproved', 'isNew', 'hasDropPrice', 'isPromoTop', 'isPromoPremium', 'isPromoTurbo'].includes(key)) {
      return ['true', '1', 'yes', 'да'].includes(value.toLowerCase());
    }
    if ([
      'pricePerDay',
      'pricePerMonth',
      'bookingComPrice',
      'dropPricePerDay',
      'dropPricePerMonth',
      'roomsTotal',
      'bedroomsCount',
      'internetSpeed',
      'yearBuilt',
      'yearRenovated',
      'distanceToSeaMinutes',
      'area',
      'clicksCount',
      'viewsCount',
      'rating',
      'reviewsCount',
      'reachMultiplier'
    ].includes(key)) {
      const parsed = Number(value.replace(/[^\d.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return value;
  };

  const extractHousingListingsFromCsv = (text: string): Listing[] => {
    const rows = parseCsvRows(text);
    if (rows.length < 2) {
      throw new Error('CSV должен содержать строку заголовков и хотя бы одну строку данных');
    }

    const headers = rows[0].map(header => header.trim());
    const items = rows.slice(1).map(row => {
      const item: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        const value = coerceCsvValue(header, row[index] || '');
        if (value !== undefined) item[header] = value;
      });
      return item;
    });

    return items.map((item, index) => {
      if (item.category && item.category !== 'housing') {
        throw new Error(`Строка ${index + 2}: category должен быть housing`);
      }
      return normalizeHousingListingForImport(item, index);
    });
  };

  const handleImportJsonFile = async (file: File) => {
    if (jsonImportCollection !== LISTINGS_COLLECTION) {
      showToast('Сейчас доступен импорт только в housing_for_rent_listing');
      return;
    }

    setIsJsonImporting(true);
    setJsonImportFileName(file.name);
    setJsonImportSummary('');

    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
      const parsedListings = isCsv
        ? extractHousingListingsFromCsv(text)
        : extractHousingListingsFromJson(JSON.parse(text));
      const usedIds = new Set(listings.map(listing => listing.id));
      const importedListings = parsedListings.map(listing => {
        const id = uniqueDocumentIdFromTitle(listing.title, usedIds);
        usedIds.add(id);
        return { ...listing, id };
      });

      for (const listing of importedListings) {
        await setDocument(LISTINGS_COLLECTION, listing.id, listing);
      }

      const message = `Импортировано ${importedListings.length} объявлений в ${LISTINGS_COLLECTION}`;
      setJsonImportSummary(message);
      showToast(message);
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setJsonImportSummary(`Ошибка импорта: ${message}`);
      showToast(`Ошибка импорта файла: ${message}`);
    } finally {
      setIsJsonImporting(false);
    }
  };

  // Sync state for L1 with overrides/defaults
  useEffect(() => {
    const l1Defaults: Record<string, { label: string; desc: string; image: string }> = {
      housing: { label: 'Жилье', desc: 'Виллы, таунхаусы, гестхаусы напрямую от владельцев', image: '' },
      transport: { label: 'Транспорт', desc: 'Аренда байков, скутеров и автомобилей без переплат', image: '' },
      investments: { label: 'Инвестиции', desc: 'Виллы, земля, готовые бизнесы на Бали с высокой окупаемостью', image: '' },
      services: { label: 'Услуги', desc: 'Проводники, няни, повара, клининг и массаж напрямую', image: '' },
      ads: { label: 'Объявления', desc: 'Аренда вещей, бытовая техника, совместное проживание', image: '' },
      afisha: { label: 'Афиша', desc: 'Ближайшие концерты, вечеринки и фестивали на Бали', image: '' },
      life: { label: 'Жизнь', desc: 'Чаты сообщества, советы по визам, контакты и взаимопомощь', image: '' },
      useful: { label: 'Полезная Информация', desc: 'Полезные гиды, информация о визах, имена балийцев, лайфхаки', image: '' }
    };
    const currentOver = menuOverrides?.l1?.[l1SelectedId] || {};
    setL1Label(currentOver.label || l1Defaults[l1SelectedId]?.label || '');
    setL1Desc(currentOver.desc || l1Defaults[l1SelectedId]?.desc || '');
    setL1Image(currentOver.image || '');
  }, [l1SelectedId, menuOverrides]);

  // Sync state for L2 with overrides/defaults
  useEffect(() => {
    const l2Defaults: Record<string, { label: string; icon: string }> = {
      entire_place: { label: 'Частная Вилла / Дом', icon: '🏡' },
      private_suite: { label: 'Апартаменты', icon: '🏢' },
      private_room: { label: 'Частная комната', icon: '🛌' },
      scooters: { label: 'Скутеры', icon: '🛵' },
      motorcycles: { label: 'Мотоциклы', icon: '🏍' },
      cars: { label: 'Автомобили', icon: '🚗' },
      villas: { label: 'Виллы & Апартаменты', icon: '🏢' },
      land: { label: 'Участки Земли', icon: '🏝' },
      business: { label: 'Готовый Бизнес', icon: '💼' },
      for_leisure: { label: 'Для отдыха & Серфинг', icon: '🏄‍♂️' },
      for_living: { label: 'Для жизни & Консультации', icon: '💼' },
      electronics: { label: 'Электроника & Фото', icon: '🔌' },
      trans_sale: { label: 'Транспорт продажа', icon: '🏍' },
      clothes: { label: 'Одежда и личные вещи', icon: '👕' },
      house_furn: { label: 'Дом и интерьер', icon: '🏡' },
      festivals: { label: 'Фестивали & Вечеринки', icon: '🎉' },
      seminars: { label: 'Бизнес-семинары', icon: '💼' },
      exhibitions: { label: 'Выставки & Детские', icon: '🎨' },
      meetings: { label: 'Встречи & Спорт', icon: '💬' },
      buddies: { label: 'Попутчики & Трипы', icon: '🛵' }
    };
    const currentOver = menuOverrides?.l2?.[l2SelectedId] || {};
    setL2Label(currentOver.label || l2Defaults[l2SelectedId]?.label || '');
    setL2Icon(currentOver.icon || l2Defaults[l2SelectedId]?.icon || '');
    setL2CustomImage(currentOver.customImage || '');
    setL2IconType(currentOver.customImage ? 'image' : 'emoji');
  }, [l2SelectedId, menuOverrides]);

  // Automatic select first subcategory when parent changes
  useEffect(() => {
    const subs = {
      housing: 'entire_place',
      transport: 'scooters',
      investments: 'villas',
      services: 'for_leisure',
      ads: 'electronics',
      afisha: 'festivals',
      life: 'meetings',
      useful: ''
    };
    setL2SelectedId((subs as any)[l2ParentId] || '');
  }, [l2ParentId]);

  const resizeAndCompressImage = (file: File, type: 'l1' | 'l2'): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Limits based on L1 category cover vs L2 small icon
          // Level 1 banner card: max width of 400px is excellent and extremely lightweight (approx ~15KB-30KB)
          // Level 2 subcategory icon: 120px is perfect size for small UI badges
          const maxWidth = type === 'l1' ? 400 : 120;
          const maxHeight = type === 'l1' ? 400 : 120;
          
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Detect if the file is a transparent format (PNG, WebP, GIF) from type or file name
          const isTransparentFormat = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif' ||
            (file.name && (file.name.toLowerCase().endsWith('.png') || file.name.toLowerCase().endsWith('.webp') || file.name.toLowerCase().endsWith('.gif')));

          let mimeType = type === 'l2' ? 'image/png' : 'image/jpeg';
          if (isTransparentFormat) {
            mimeType = file.type && file.type.startsWith('image/') 
              ? file.type 
              : (file.name && file.name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png');
          }

          // If the output format is JPEG, pre-fill with a clean white background so transparent parts don't turn black
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const quality = 0.75;
          const dataUrl = canvas.toDataURL(mimeType, quality);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Canvas conversion to Blob failed'));
            }
          }, mimeType, quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleUploadFile = async (file: File, type: 'l1' | 'l2'): Promise<string> => {
    try {
      showToast('⏳ Оптимизация изображения...');
      const { blob, dataUrl } = await resizeAndCompressImage(file, type);
      
      if (uploadMethod === 'storage') {
        try {
          const randomToken = Math.random().toString(36).substring(2, 9);
          const originalBaseName = file.name ? file.name.substring(0, file.name.lastIndexOf('.')) : 'photo';
          const cleanBaseName = originalBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
          
          // Get correct extension from the blob's actual MIME type
          let ext = 'jpg';
          if (blob.type === 'image/png') ext = 'png';
          else if (blob.type === 'image/webp') ext = 'webp';
          else if (blob.type === 'image/gif') ext = 'gif';

          const filePath = `menu_images/${type}_${Date.now()}_${randomToken}_${cleanBaseName}_compressed.${ext}`;
          // Convert blob back to a File object for consistent firebase upload
          const compressedFile = new File([blob], `${type}_compressed.${ext}`, { type: blob.type });
          const downloadUrl = await uploadFileToStorage(compressedFile, filePath);
          return downloadUrl;
        } catch (e: any) {
          console.error('Firebase Storage upload failed, falling back to Base64', e);
          showToast('⚠️ Ошибка Storage. Сохранено в формате Base64 в Firestore.');
        }
      }
      
      return dataUrl;
    } catch (e: any) {
      console.error('Failed to resize and load image', e);
      showToast('❌ Ошибка при обработке изображения. Загружаем оригинал.');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    }
  };

  const handleSaveL1 = async () => {
    setIsMenuSaving(true);
    try {
      const newL1 = {
        ...menuOverrides.l1,
        [l1SelectedId]: {
          ...menuOverrides.l1?.[l1SelectedId],
          label: l1Label,
          desc: l1Desc,
          image: l1Image
        }
      };
      const updatedOverrides = {
        ...menuOverrides,
        l1: newL1
      };
      if (onUpdateMenuOverrides) {
        await onUpdateMenuOverrides(updatedOverrides);
        showToast('✨ Категория L1 успешно синхронизирована!');
      }
    } catch (e) {
      console.error(e);
      showToast('❌ Не удалось обновить категорию');
    } finally {
      setIsMenuSaving(false);
    }
  };

  const handleSaveL2 = async () => {
    setIsMenuSaving(true);
    try {
      const newL2 = {
        ...menuOverrides.l2,
        [l2SelectedId]: {
          ...menuOverrides.l2?.[l2SelectedId],
          label: l2Label,
          icon: l2IconType === 'emoji' ? l2Icon : '🏡',
          customImage: l2IconType === 'image' ? l2CustomImage : ''
        }
      };
      const updatedOverrides = {
        ...menuOverrides,
        l2: newL2
      };
      if (onUpdateMenuOverrides) {
        await onUpdateMenuOverrides(updatedOverrides);
        showToast('✨ Подкатегория L2 успешно синхронизирована!');
      }
    } catch (e) {
      console.error(e);
      showToast('❌ Не удалось обновить подгруппу');
    } finally {
      setIsMenuSaving(false);
    }
  };

  // Search & Filtering States
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  const [listingSearch, setListingSearch] = useState<string>('');
  const [listingCategoryFilter, setListingCategoryFilter] = useState<string>('all');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all');

  // New admin user form modal
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator' | 'host' | 'guest'>('guest');

  // Rejection modal context
  const [rejectListingId, setRejectListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Notification Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load Admin Users from localStorage or populate defaults
    const storedUsers = localStorage.getItem('bali_base_admin_users');
    if (storedUsers) {
      try {
        setAdminUsers(JSON.parse(storedUsers));
      } catch {
        setAdminUsers(DEFAULT_ADMIN_USERS);
      }
    } else {
      setAdminUsers(DEFAULT_ADMIN_USERS);
      localStorage.setItem('bali_base_admin_users', JSON.stringify(DEFAULT_ADMIN_USERS));
    }

    // Load Tickets
    const storedTickets = localStorage.getItem('bali_base_admin_tickets');
    if (storedTickets) {
      try {
        setTickets(JSON.parse(storedTickets));
      } catch {
        setTickets(DEFAULT_TICKETS);
      }
    } else {
      setTickets(DEFAULT_TICKETS);
      localStorage.setItem('bali_base_admin_tickets', JSON.stringify(DEFAULT_TICKETS));
    }

    // Config flags
    const savedAutoApprove = localStorage.getItem('bali_base_config_autoapprove');
    if (savedAutoApprove) setAutoApprove(savedAutoApprove === 'true');
    const savedMaintenance = localStorage.getItem('bali_base_config_maintenance');
    if (savedMaintenance) setMaintenanceMode(savedMaintenance === 'true');
  }, []);

  const saveUsers = (newUsersList: AdminUser[]) => {
    setAdminUsers(newUsersList);
    localStorage.setItem('bali_base_admin_users', JSON.stringify(newUsersList));
  };

  const saveTicketsList = (newTicketsList: SupportTicket[]) => {
    setTickets(newTicketsList);
    localStorage.setItem('bali_base_admin_tickets', JSON.stringify(newTicketsList));
    if (selectedTicket) {
      const updated = newTicketsList.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Create User Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone) {
      showToast('⚠️ Пожалуйста, заполните все поля!');
      return;
    }
    const newUser: AdminUser = {
      id: `user-generated-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      status: 'active',
      listingsCount: 0,
      registeredAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
    };
    saveUsers([...adminUsers, newUser]);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    showToast(`✅ Пользователь ${newUserName} успешно создан!`);
  };

  // Change Role Handler
  const handleChangeRole = (userId: string, newRole: 'admin' | 'moderator' | 'host' | 'guest') => {
    const updated = adminUsers.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    saveUsers(updated);
    showToast(`💼 Роль пользователя изменена на ${newRole}`);
  };

  // Toggle User Ban Status
  const handleToggleUserBan = (userId: string) => {
    const updated = adminUsers.map(u => {
      if (u.id === userId) {
        const toggle = u.status === 'banned' ? 'active' : 'banned';
        return { ...u, status: toggle as 'active' | 'banned' };
      }
      return u;
    });
    saveUsers(updated);
    const matched = adminUsers.find(u => u.id === userId);
    const verb = matched?.status === 'active' ? 'заблокирован' : 'разблокирован';
    showToast(`🚫 Пользователь ${matched?.name} ${verb}!`);
  };

  // Delete User Handler
  const handleDeleteUser = (userId: string) => {
    const updated = adminUsers.filter(u => u.id !== userId);
    saveUsers(updated);
    showToast('🗑️ Пользователь удален');
  };

  // Add Message Reply Simulator
  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    const newMsg = {
      id: `reply-${Date.now()}`,
      sender: 'admin' as const,
      text: replyText,
      timestamp: new Date().toISOString()
    };
    const updated = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    });
    saveTicketsList(updated);
    setReplyText('');
    showToast('✉️ Ответ успешно отправлен!');

    // Simulate standard host reply after 2 seconds for interactivity
    setTimeout(() => {
      const answersSim = [
        "Отлично! Спасибо за быстрый ответ, всё заработало",
        "Хорошо, я проверила, действительно синхронизация обновилась",
        "Договорились, буду ждать звонка менеджера",
        "Понятно, спасибо за разъяснения и классный сервис Бали Бейс!"
      ];
      const randomAnswer = answersSim[Math.floor(Math.random() * answersSim.length)];
      const answerMsg = {
        id: `reply-sim-${Date.now()}`,
        sender: 'user' as const,
        text: randomAnswer,
        timestamp: new Date().toISOString()
      };
      
      setTickets(prev => {
        const up = prev.map(t => {
          if (t.id === selectedTicket.id) {
            return {
              ...t,
              messages: [...t.messages, answerMsg]
            };
          }
          return t;
        });
        localStorage.setItem('bali_base_admin_tickets', JSON.stringify(up));
        return up;
      });
    }, 2000);
  };

  // Booking updates stats calculated
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active').length;
  const moderationListings = listings.filter(l => l.status === 'moderation').length;
  const totalViews = listings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);
  const totalClicksCol = listings.reduce((sum, item) => sum + (item.clicksCount || 0), 0);

  // Group views by district for a high-fidelity visual statistics indicator 
  const districtViewsStats = BALI_DISTRICTS.map(dist => {
    const dListings = listings.filter(l => l.district === dist);
    const dViews = dListings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);
    const dClicks = dListings.reduce((sum, item) => sum + (item.clicksCount || 0), 0);
    return {
      name: dist,
      views: dViews,
      clicks: dClicks,
      count: dListings.length
    };
  }).sort((a, b) => b.views - a.views);

  const totalDistrictViews = districtViewsStats.reduce((sum, item) => sum + item.views, 0) || 1;

  // Filter lists based on inputs
  const filteredUsersList = adminUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.phone.includes(userSearch);
    const matchRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'all' ? true : u.status === userStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredListingsList = listings.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
                        l.ownerName.toLowerCase().includes(listingSearch.toLowerCase()) ||
                        l.district.toLowerCase().includes(listingSearch.toLowerCase());
    const matchCat = listingCategoryFilter === 'all' ? true : l.category === listingCategoryFilter;
    const matchStat = listingStatusFilter === 'all' ? true : l.status === listingStatusFilter;
    return matchSearch && matchCat && matchStat;
  });

  // Moderation filters 
  const moderationItems = listings.filter(l => l.status === 'moderation');

  const handleActivateAllListings = async () => {
    const inactiveListings = listings.filter(l => l.status !== 'active');
    if (!inactiveListings.length) {
      showToast('Все объявления уже активны');
      return;
    }

    const usedIds = new Set(listings.filter(listing => listing.status === 'active').map(listing => listing.id));
    for (const [index, listing] of inactiveListings.entries()) {
      const nextListing = listing.category === 'housing'
        ? normalizeHousingListingForImport({ ...listing, status: 'active' }, index)
        : { ...listing, status: 'active' as const };
      const id = uniqueDocumentIdFromTitle(nextListing.title, usedIds);
      usedIds.add(id);
      if (id !== listing.id) {
        await deleteDocument(LISTINGS_COLLECTION, listing.id);
      }
      await setDocument(LISTINGS_COLLECTION, id, { ...nextListing, id });
    }

    showToast(`Активировано объявлений: ${inactiveListings.length}`);
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleDeleteAllModeration = async () => {
    if (!moderationItems.length) {
      showToast('Очередь модерации уже пуста');
      return;
    }

    for (const item of moderationItems) {
      await deleteDocument(LISTINGS_COLLECTION, item.id);
    }

    showToast(`Удалено объявлений на модерации: ${moderationItems.length}`);
    setTimeout(() => window.location.reload(), 1200);
  };

  // Listing Approved controls
  const handleApprove = (listingId: string) => {
    const matched = listings.find(l => l.id === listingId);
    if (matched) {
      const updated: Listing = {
        ...matched,
        status: 'active',
        isApproved: true
      };
      onUpdateListing(updated);
      showToast(`🎉 Объявление "${matched.title}" одобрено и размещено!`);
    }
  };

  const handleOpenReject = (listingId: string) => {
    setRejectListingId(listingId);
    setRejectionReason('Фотографии не соответствуют стандартам качества');
  };

  const handleRejectConfirm = () => {
    if (!rejectListingId) return;
    const matched = listings.find(l => l.id === rejectListingId);
    if (matched) {
      const updated: Listing = {
        ...matched,
        status: 'draft',
        isApproved: false,
        description: `${matched.description}\n\n⚠️ Комментарий модератора: ${rejectionReason}`
      };
      onUpdateListing(updated);
      showToast(`❌ Объявление отклонено с указанием причины`);
    }
    setRejectListingId(null);
  };

  const tabProps = {
    setActiveTab,
    adminUsers,
    totalListings,
    activeListings,
    moderationListings,
    totalClicksCol,
    totalViews,
    districtViewsStats,
    totalDistrictViews,
    filteredUsersList,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    setShowAddUserModal,
    handleChangeRole,
    handleToggleUserBan,
    handleDeleteUser,
    listings,
    filteredListingsList,
    listingSearch,
    setListingSearch,
    listingCategoryFilter,
    setListingCategoryFilter,
    listingStatusFilter,
    setListingStatusFilter,
    onUpdateListing,
    showToast,
    onToggleStatus,
    onDeleteListing,
    handleActivateAllListings,
    moderationItems,
    handleDeleteAllModeration,
    handleApprove,
    handleOpenReject,
    tickets,
    selectedTicket,
    setSelectedTicket,
    replyText,
    setReplyText,
    handleSendReply,
    autoApprove,
    setAutoApprove,
    maintenanceMode,
    setMaintenanceMode,
    commissionRate,
    setCommissionRate,
    siteName,
    setSiteName,
    telegramSupportLink,
    setTelegramSupportLink,
    wizardLevel,
    setWizardLevel,
    l1SelectedId,
    setL1SelectedId,
    l1Label,
    setL1Label,
    l1Desc,
    setL1Desc,
    l1Image,
    setL1Image,
    l2ParentId,
    setL2ParentId,
    l2SelectedId,
    setL2SelectedId,
    l2Label,
    setL2Label,
    l2Icon,
    setL2Icon,
    l2CustomImage,
    setL2CustomImage,
    l2IconType,
    setL2IconType,
    uploadMethod,
    setUploadMethod,
    isMenuSaving,
    jsonImportCollection,
    setJsonImportCollection,
    jsonImportFileName,
    jsonImportSummary,
    isJsonImporting,
    dragActive,
    setDragActive,
    handleUploadFile,
    handleImportJsonFile,
    handleSaveL1,
    handleSaveL2
  };
  return {
    activeTab,
    setActiveTab,
    adminUsers,
    moderationListings,
    toastMessage,
    showToast,
    tabProps,
    showAddUserModal,
    setShowAddUserModal,
    newUserName,
    newUserEmail,
    newUserPhone,
    newUserRole,
    setNewUserName,
    setNewUserEmail,
    setNewUserPhone,
    setNewUserRole,
    handleCreateUser,
    rejectListingId,
    rejectionReason,
    setRejectionReason,
    setRejectListingId,
    handleRejectConfirm
  };
}
