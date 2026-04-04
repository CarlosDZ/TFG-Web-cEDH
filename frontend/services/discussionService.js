import { orderCommentArray } from "../utils/discussionAlgorithm.js";

export async function getOrderedDiscussions() {
    const res = await fetch("/api/comment/");
    const unordered_data = await res.json();

    return orderCommentArray(unordered_data);
}

export async function getReplies(commentId) {
    const res = await fetch(`/api/comment/${commentId}/replies`);
    return await res.json();
}