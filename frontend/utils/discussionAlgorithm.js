const TIME_ALIVE_WEIGHT = 1;

function importanceScore(comment) {
    const likes = comment.likes;
    const hrs_alive = (new Date() - comment.createdAt) / (1000 * 60 * 60);

    return Math.log(1 + likes) / (1 + hrs_alive) ** TIME_ALIVE_WEIGHT;
}
