import fs from "node:fs";
import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
} from "@firebase/rules-unit-testing";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";

const PROJECT_ID = "bali-base-90ca8";

const rules = fs.readFileSync("firestore.rules", "utf8");

const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
        rules,
        host: "127.0.0.1",
        port: 8080,
    },
});

const ownerId = "owner-user";
const otherUserId = "other-user";
const guestId = "guest-user";

const validListing = {
    id: "listing-1",
    ownerId,
    category: "transport",
    title: "Test listing",
    description: "Test description",
    district: "Ubud",
    images: [],
    status: "active",
    pricePerDay: 100000,
    isApproved: false,
    isVerified: false,
};

async function seed() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        await setDoc(doc(db, "listings", "listing-1"), validListing);

        await setDoc(doc(db, "users", ownerId), {
            uid: ownerId,
            email: "owner@example.com",
            role: "guest",
            status: "active",
        });

        await setDoc(doc(db, "users", otherUserId), {
            uid: otherUserId,
            email: "other@example.com",
            role: "guest",
            status: "active",
        });

        await setDoc(doc(db, "bookings", "booking-1"), {
            id: "booking-1",
            listingId: "listing-1",
            guestId,
            listingOwnerId: ownerId,
            guestName: "Guest",
            guestPhone: "+62123456789",
            startDate: "2026-10-10",
            endDate: "2026-10-15",
            totalDays: 5,
            status: "pending",
            totalPrice: 500000,
        });
    });
}

async function run(name, fn) {
    try {
        await fn();
        console.log(`PASS: ${name}`);
    } catch (error) {
        console.error(`FAIL: ${name}`);
        console.error(error?.message || error);
        process.exitCode = 1;
    }
}

await testEnv.clearFirestore();
await seed();

/*
 * PUBLIC READ
 */

await run("Unauthenticated user can read public listing", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
        getDoc(doc(db, "listings", "listing-1"))
    );
});

/*
 * LISTING OWNERSHIP
 */

await run("Unauthenticated user cannot create listing", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
        setDoc(doc(db, "listings", "anonymous-listing"), {
            ...validListing,
            id: "anonymous-listing",
        })
    );
});

await run("Owner can create own listing", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertSucceeds(
        setDoc(doc(db, "listings", "owner-listing"), {
            ...validListing,
            id: "owner-listing",
        })
    );
});

await run("User cannot create listing for another owner", async () => {
    const db = testEnv.authenticatedContext(otherUserId, { email_verified: true, email: "other@test.com" }).firestore();

    await assertFails(
        setDoc(doc(db, "listings", "fake-owner-listing"), {
            ...validListing,
            id: "fake-owner-listing",
            ownerId,
        })
    );
});

await run("Owner can update own listing", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertSucceeds(
        updateDoc(doc(db, "listings", "listing-1"), {
            title: "Updated title",
        })
    );
});

await run("Another user cannot update owner's listing", async () => {
    const db = testEnv.authenticatedContext(otherUserId, { email_verified: true, email: "other@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "listings", "listing-1"), {
            title: "Hacked title",
        })
    );
});

await run("Owner cannot change ownerId", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "listings", "listing-1"), {
            ownerId: otherUserId,
        })
    );
});

await run("Owner cannot approve own listing", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "listings", "listing-1"), {
            isApproved: true,
        })
    );
});

await run("Verified email alone does not grant administrator access", async () => {
    const db = testEnv.authenticatedContext("email-only-admin", {
        email_verified: true,
        email: "krasnovilya87@gmail.com",
    }).firestore();

    await assertFails(
        updateDoc(doc(db, "listings", "listing-1"), {
            isApproved: true,
        })
    );
});

await run("Administrator custom claim grants administrator access", async () => {
    const db = testEnv.authenticatedContext("claimed-admin", {
        admin: true,
    }).firestore();

    await assertSucceeds(
        updateDoc(doc(db, "listings", "listing-1"), {
            isApproved: true,
        })
    );
});

await run("Another user cannot delete owner's listing", async () => {
    const db = testEnv.authenticatedContext(otherUserId, { email_verified: true, email: "other@test.com" }).firestore();

    await assertFails(
        deleteDoc(doc(db, "listings", "listing-1"))
    );
});

/*
 * USER DOCUMENTS
 */

await run("User can read own profile", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertSucceeds(
        getDoc(doc(db, "users", ownerId))
    );
});

await run("User cannot read another user's profile", async () => {
    const db = testEnv.authenticatedContext(otherUserId, { email_verified: true, email: "other@test.com" }).firestore();

    await assertFails(
        getDoc(doc(db, "users", ownerId))
    );
});

await run("Unauthenticated user cannot read user profile", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
        getDoc(doc(db, "users", ownerId))
    );
});

await run("User cannot change own role", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "users", ownerId), {
            role: "admin",
        })
    );
});

await run("User cannot change own status", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "users", ownerId), {
            status: "admin",
        })
    );
});

/*
 * BOOKINGS
 */

await run("Guest can read own booking", async () => {
    const db = testEnv.authenticatedContext(guestId, { email_verified: true, email: "guest@test.com" }).firestore();

    await assertSucceeds(
        getDoc(doc(db, "bookings", "booking-1"))
    );
});

await run("Listing owner can read booking", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertSucceeds(
        getDoc(doc(db, "bookings", "booking-1"))
    );
});

await run("Unrelated user cannot read booking", async () => {
    const db = testEnv.authenticatedContext(otherUserId, { email_verified: true, email: "other@test.com" }).firestore();

    await assertFails(
        getDoc(doc(db, "bookings", "booking-1"))
    );
});

await run("Guest cannot change booking status", async () => {
    const db = testEnv.authenticatedContext(guestId, { email_verified: true, email: "guest@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "bookings", "booking-1"), {
            status: "accepted",
        })
    );
});

await run("Listing owner can change booking status", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertSucceeds(
        updateDoc(doc(db, "bookings", "booking-1"), {
            status: "accepted",
        })
    );
});

await run("Listing owner cannot change booking guestId", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        updateDoc(doc(db, "bookings", "booking-1"), {
            guestId: otherUserId,
        })
    );
});

/*
 * DEFAULT DENY
 */

await run("Unknown collection is denied", async () => {
    const db = testEnv.authenticatedContext(ownerId, { email_verified: true, email: "owner@test.com" }).firestore();

    await assertFails(
        getDoc(doc(db, "secret_collection", "secret-document"))
    );
});

await testEnv.cleanup();

console.log("\nFirestore Rules security tests finished.");
