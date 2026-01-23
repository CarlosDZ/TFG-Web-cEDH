import { orderByScore } from "../utils/discussionAlgorithm.js";

export async function getOrderedDiscussionPanel() {
    const res = await fetch("/api/comment/");
    const unordered_data = await res.json();

    return orderByScore(unordered_data);
}
