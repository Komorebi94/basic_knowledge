/**
 * \b 是单词边界，具体就是 \w 与 \W 之间的位置，也包括 \w 与 ^ 之间的位置，和 \w 与 $ 之间的位置。
 * \w: [0-9a-zA-Z_] 数字、字母、下划线
 * \W: [^0-9a-zA-Z]
 */

const result = "[JS] Lesson_01.mp4".replace(/\b/g, "#");

console.log(result);

console.log("[JS] Lesson_01.mp4".replace(/\B/g, "#"))