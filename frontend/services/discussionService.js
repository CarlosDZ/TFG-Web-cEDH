import { orderCommentArray } from "../utils/discussionAlgorithm.js";

export async function getOrderedDiscussions() {
    const res = await fetch("/api/comment/");
    const unordered_data = await res.json();

    return orderCommentArray(unordered_data);
}
