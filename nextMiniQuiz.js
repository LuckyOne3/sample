import * as quiz from "@/store/createList";

// определеяем следующий вопрос для перехода по первому блоку
export function nextIssue(data) {
    // если данные готовы то всегда вернём Конец
    if (data.done) return quiz.QuizEnd;

    let from = data.path[data.path.length - 1];
    //console.log("nextIssue", from, data);

    if (!from) return quiz.Quiz101;

    if (from === quiz.Quiz101) return quiz.Quiz102;

    if (from === quiz.Quiz102) return quiz.Quiz103;

    if (from === quiz.Quiz103)
        if (data?.[quiz.Quiz103] === "Да") return quiz.Quiz105;
        else return quiz.Quiz104;

    if (from === quiz.Quiz104) return quiz.QuizEnd;

    if (from === quiz.Quiz105)
        if (data?.[quiz.Quiz105] === "Нет") return quiz.QuizEnd;
        else return quiz.Quiz106;

    if (from === quiz.Quiz106) return quiz.Quiz107;

    if (from === quiz.Quiz107)
        if (data?.[quiz.Quiz107] === "Да" || data?.[quiz.Quiz107] === "Иногда")
            return quiz.Quiz108;
        else return quiz.Quiz109;

    if (from === quiz.Quiz108) return quiz.Quiz109;

    if (from === quiz.Quiz109) {
        let id = data?.[quiz.Quiz109]?.[0]?.id;
        if (id == 1) return quiz.QuizGoToBlock;
        if (id == 18) return quiz.Quiz110;
        return quiz.Quiz111;
    }
    if (from === quiz.Quiz110) return quiz.Quiz111;

    if (from === quiz.Quiz111) return quiz.QuizGoToBlock;

    if (from === quiz.QuizGoToBlock) return quiz.QuizChooseOption;

    if (from === quiz.QuizChooseOption) return quiz.QuizChooseOption;

    // иди откуда пришёл
    if (from === quiz.QuizEnd) return quiz.QuizEnd;

    throw new Error(`Не известный вопрос :"${from}"`);
}

export function nextIssueBlock2(data) {
    // если данные готовы то всегда вернём Конец
    if (data.done) return quiz.QuizBlockEnd;

    function getNext(from) {
        // текущий курсор в ответах
        let ind = data.quizes?.indexOf(from);
        // пока что прямой переход без условий на следующий вопрос
        return ind < data.quizes?.length - 1
            ? data.quizes[ind + 1]
            : quiz.QuizBlockEnd;
    }

    // откуда пришли
    let from = data.path && data.path[data.path.length - 1];
    //console.log("nextIssueBlock2", from, data);
    let to = getNext(from);

    // проверяем переход по правилам
    if (to === quiz.Quiz206 && data[quiz.Quiz205] !== "Да") {
        to = getNext(to);
    }
    if (to === quiz.Quiz210 && !data[quiz.Quiz209].find(el => el.id === 13)) {
        to = getNext(to);
    }
    if (to === quiz.Quiz213 && data[quiz.Quiz212] !== "Да") {
        to = getNext(to);
    }
    if (to === quiz.Quiz215 && data[quiz.Quiz214] !== "Да") {
        to = getNext(to);
    }

    //console.log("Block-2 from =", from, "to =", to, "i =", ind);
    return to;
}
