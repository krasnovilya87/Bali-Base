export type AiModerationRule = {
  id: string;
  titleKey: string;
  rejectionReasonKey: string;
  promptTitle: string;
  promptDescription: string;
};

export const AI_MODERATION_RULES: AiModerationRule[] = [
  {
    id: 'missing_photos',
    titleKey: 'admin.aiModeration.rule.missingPhotos',
    rejectionReasonKey: 'admin.reject.reason.missingPhotos',
    promptTitle: 'Required photos are present',
    promptDescription: 'The listing has enough real object photos to understand the property.'
  },
  {
    id: 'low_quality_photos',
    titleKey: 'admin.aiModeration.rule.lowQualityPhotos',
    rejectionReasonKey: 'admin.reject.reason.lowQualityPhotos',
    promptTitle: 'Photos are clear and useful',
    promptDescription: 'Photos are not obviously blurry, unusable, mostly decorative, or too low quality.'
  },
  {
    id: 'missing_description',
    titleKey: 'admin.aiModeration.rule.missingDescription',
    rejectionReasonKey: 'admin.reject.reason.missingDescription',
    promptTitle: 'Description is informative',
    promptDescription: 'The description explains what is offered and is not empty, generic, or meaningless.'
  },
  {
    id: 'insufficient_location',
    titleKey: 'admin.aiModeration.rule.insufficientLocation',
    rejectionReasonKey: 'admin.reject.reason.insufficientLocation',
    promptTitle: 'Location is sufficient',
    promptDescription: 'District, address, or coordinates are specific enough for a moderator to understand the object location.'
  },
  {
    id: 'missing_price',
    titleKey: 'admin.aiModeration.rule.missingPrice',
    rejectionReasonKey: 'admin.reject.reason.missingPrice',
    promptTitle: 'Price is present',
    promptDescription: 'The listing includes a plausible daily or monthly price.'
  },
  {
    id: 'wrong_category',
    titleKey: 'admin.aiModeration.rule.wrongCategory',
    rejectionReasonKey: 'admin.reject.reason.wrongCategory',
    promptTitle: 'Category matches the offer',
    promptDescription: 'The category and subcategory match the title, description, and listing details.'
  },
  {
    id: 'contradictions',
    titleKey: 'admin.aiModeration.rule.contradictions',
    rejectionReasonKey: 'admin.reject.reason.contradictions',
    promptTitle: 'No obvious contradictions',
    promptDescription: 'The title, description, price, location, amenities, and parameters do not contradict each other.'
  },
  {
    id: 'photos_mismatch',
    titleKey: 'admin.aiModeration.rule.photosMismatch',
    rejectionReasonKey: 'admin.reject.reason.photosMismatch',
    promptTitle: 'Photos match the listing',
    promptDescription: 'The available image URLs and text do not suggest that photos belong to a different object or unrelated promotion.'
  },
  {
    id: 'promotional_images',
    titleKey: 'admin.aiModeration.rule.promotionalImages',
    rejectionReasonKey: 'admin.reject.reason.promotionalImages',
    promptTitle: 'No promotional image abuse',
    promptDescription: 'Images are not mainly posters, banners, screenshots, contact cards, watermarks, or ads.'
  },
  {
    id: 'duplicate_or_spam',
    titleKey: 'admin.aiModeration.rule.duplicateOrSpam',
    rejectionReasonKey: 'admin.reject.reason.spam',
    promptTitle: 'No spam signals',
    promptDescription: 'The listing does not look like spam, duplicated filler, keyword stuffing, or a low-effort fake.'
  },
  {
    id: 'fraud_signs',
    titleKey: 'admin.aiModeration.rule.fraudSigns',
    rejectionReasonKey: 'admin.reject.reason.fraudSigns',
    promptTitle: 'No obvious fraud signs',
    promptDescription: 'The listing does not contain suspicious claims, unsafe payment pressure, fake urgency, or misleading promises.'
  },
  {
    id: 'invalid_contacts',
    titleKey: 'admin.aiModeration.rule.invalidContacts',
    rejectionReasonKey: 'admin.reject.reason.invalidContacts',
    promptTitle: 'Contacts are usable',
    promptDescription: 'Owner name and WhatsApp/contact data are present enough for the platform workflow.'
  }
];
