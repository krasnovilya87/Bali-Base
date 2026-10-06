import { getCollection, setDocument } from '../firebase';
import type { Review } from '../types';

const getListingReviewsCollection = (listingId: string) =>
  `listing_reviews/${listingId}/items`;

export type ListingReview = Review & {
  listingId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export const loadListingReviews = async (listingId: string): Promise<ListingReview[]> => {
  const reviews = await getCollection<ListingReview>(getListingReviewsCollection(listingId));
  return reviews.sort((left, right) =>
    new Date(right.updatedAt || right.date).getTime() - new Date(left.updatedAt || left.date).getTime()
  );
};

export const saveListingReview = async (review: ListingReview): Promise<void> => {
  await setDocument(getListingReviewsCollection(review.listingId), review.authorId, review);
};
