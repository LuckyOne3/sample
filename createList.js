// Начало - скелетон
export const Quiz000 = "Quiz000";
// Блок 1
export const Quiz101 = "Quiz101";
export const Quiz102 = "Quiz102";
export const Quiz103 = "Quiz103";
export const Quiz104 = "Quiz104";
export const Quiz105 = "Quiz105";
export const Quiz106 = "Quiz106";
export const Quiz107 = "Quiz107";
export const Quiz108 = "Quiz108";
export const Quiz109 = "Quiz109";
export const Quiz110 = "Quiz110";
// Пункты для вопросов блока 2
export const Quiz111 = "Quiz111";

// Опции переход на блок 2
export const QuizGoToBlock = "QuizGoToBlock";
// Выбор комбинации
export const QuizChooseOption = "QuizChooseOption";
// Вопросы блока 2
export const Quiz201 = "Quiz201";
export const Quiz202 = "Quiz202";
export const Quiz203 = "Quiz203";
export const Quiz204 = "Quiz204";
export const Quiz205 = "Quiz205";
export const Quiz206 = "Quiz206";
export const Quiz207 = "Quiz207";
export const Quiz208 = "Quiz208";
export const Quiz209 = "Quiz209";
export const Quiz210 = "Quiz210";
export const Quiz211 = "Quiz211";
export const Quiz212 = "Quiz212";
export const Quiz213 = "Quiz213";
export const Quiz214 = "Quiz214";
export const Quiz215 = "Quiz215";
// Конец комбинации для блока 2
export const QuizBlockEnd = "QuizBlockEnd";

// Конец анкеты
export const QuizEnd = "QuizEnd";

function canProceed(data, quizKey) {
    return data[quizKey] && data.path?.includes(quizKey);
}

function GetQuiz2Path(data) {
    let qzs;
    if (!data) {
        qzs = [
            Quiz201,
            Quiz202,
            Quiz203,
            Quiz204,
            Quiz205,
            Quiz206,
            Quiz207,
            Quiz208,
            Quiz209,
            Quiz210,
            Quiz211,
            Quiz212,
            Quiz213,
            Quiz214,
            Quiz215
        ];
    } else {
        // Вопросы блока 2 по ответам в 1.11
        qzs = [];
        data.forEach(itm =>
            itm.val?.forEach(q => {
                // а могут ли быть дубли?
                if (!qzs.includes(q)) qzs.push(q);
            })
        );
        // Упорядочить в порядке задавания
        qzs.sort();
    }
    return qzs;
}

function GetDefData(data, quiz_data) {
    let qzs = GetQuiz2Path(quiz_data);
    return {
        ...data,
        quizes: qzs,
        path: [],
        currentIssue: qzs?.[0],
        done: false
    };
}

// Создаём элементы для БЛОК-2
export function createList(data) {
    let items = []; // массив комбинаций

    // Первым пунктом самостоятельная услуга
    items.push(
        GetDefData(
            {
                code: data.code,
                text: data.text,
                isSelf: 1
            },
            null // все варианты
        )
    );

    //1.6 Уточните, пожалуйста, в комбинации с какими операциями она может выполняться наиболее часто?
    if (canProceed(data, Quiz106)) {
        data[Quiz106].forEach(el =>
            items.push(
                GetDefData(
                    {
                        ...el,
                        isService: 1
                    },
                    data[Quiz111]
                )
            )
        );
    }

    // 1.9 Укажите какое дополнительное оборудование / метод (ы) или их комбинация используются во время выполнения данной операции?
    if (canProceed(data, Quiz109)) {
        // если выбран: 18. Комбинация из выше указанных методов и/или используемого дополнительного оборудования
        if (
            data[Quiz109]?.find(el => el.id == 18) &&
            canProceed(data, Quiz110)
        ) {
            // 1.10 Выберете возможные варианты комбинаций дополнительного оборудования
            // и/или методов наиболее часто используемые во время выполнения данной операции?
            data[Quiz110].filter(el => el.id != 12).forEach(el =>
                items.push(
                    GetDefData(
                        {
                            ...el,
                            isEquipmentComb: 1
                        },
                        data[Quiz111]
                    )
                )
            );
            // отдельно обработать 12. Прочие
            // порежем все варианты по новой строке
            let arr = data[Quiz110].find(el => el.id == 12)
                ?.customText?.split(`\n`)
                .map(text => text.trim())
                .filter(text => text);
            if (arr)
                arr.forEach(el => {
                    if (!items.find(d => d.isEquipmentCustom && d.text === el))
                        items.push(
                            GetDefData(
                                {
                                    text: el,
                                    isEquipmentCustom: 1
                                },
                                data[Quiz111]
                            )
                        );
                });
        }
        // если нет выбранного: 1. Может выполняться без дополнительного оборудования / метода (ов)
        if (!data[Quiz109]?.find(el => el.id == 1)) {
            // перебираем всё кроме 1, 18, 19
            let arr = data[Quiz109].filter(el => ![1, 18, 19].includes(el.id));
            if (arr)
                arr.forEach(el =>
                    items.push(
                        GetDefData(
                            {
                                ...el,
                                isEquipment: 1
                            },
                            data[Quiz111]
                        )
                    )
                );

            // отдельно обработать 19. Прочие
            // порежем все варианты по новой строке
            arr = data[Quiz109].find(el => el.id == 19)
                ?.customText?.split(`\n`)
                .map(text => text.trim())
                .filter(text => text);

            if (arr)
                arr.forEach(el => {
                    if (!items.find(d => d.isEquipmentCustom && d.text === el))
                        items.push(
                            GetDefData(
                                {
                                    text: el,
                                    isEquipmentCustom: 1
                                },
                                data[Quiz111]
                            )
                        );
                });
        }
    }
    return items;
}

function createCopy(data) {
    if (typeof data !== "object") return data;
    else return JSON.parse(JSON.stringify(data));
}

function insideCopy(dataDest, dataSrc, excludeKeys) {
    if (!dataSrc || !dataDest) return;
    Object.keys(dataSrc).forEach(key => {
        if (!excludeKeys || !excludeKeys.includes(key)) {
            dataDest[key] = createCopy(dataSrc[key]);
        }
    });
}

function isSameArr(arr1, arr2) {
    if (arr1?.length !== arr2?.length) return false;
    for (let i = 0; i < arr2?.length; i++)
        if (arr1[i] !== arr2[i]) return false;
    return true;
}

export function reCreateList(data, newData) {
    if (!newData) return [];
    if (!data) return newData;

    let result = newData;
    // проверим а было ли измененение в вопросах quizes[]
    // если последовательность вопросов не менялась делаем полную копию
    // проверим по 2-ому элементу
    const reQuiz = !isSameArr(data?.[1]?.quizes, newData?.[1]?.quizes);
    // сделаем стек старых и будем убирать найденые
    let stack = [...data];
    // обходим по новым данным и забираем из старых всё что нужно
    result.forEach(newEl => {
        for (let i = 0; i < stack.length; i++) {
            const el = stack[i];

            // собственная услуга - полная копия
            if (el.isSelf && newEl.isSelf) {
                insideCopy(newEl, el);
                stack.splice(i, 1); // убираем найденый
                break;
            }
            if (
                // 1.6 Уточните, пожалуйста, в комбинации с какими операциями она может выполняться наиболее часто?
                (el.isService && newEl.isService && el.code === newEl.code) ||
                // 1.9 комбинация с доп.оборудованием
                (el.isEquipment && newEl.isEquipment && el.id === newEl.id) ||
                // 1.10 Выберете возможные варианты комбинаций дополнительного оборудования
                // и/или методов наиболее часто используемые во время выполнения данной операции?
                (el.isEquipmentComb &&
                    newEl.isEquipmentComb &&
                    el.id === newEl.id) ||
                // Комбинации с текстом прочее
                (el.isEquipmentCustom &&
                    newEl.isEquipmentCustom &&
                    el.text === newEl.text)
            ) {
                insideCopy(
                    newEl,
                    el,
                    reQuiz || // проверка на необходимость полной копию
                        // если массивы  alwaysOrSometimes разные
                        !isSameArr(
                            el.alwaysOrSometimes,
                            newEl.alwaysOrSometimes
                        )
                        ? [
                              "path",
                              "quizes",
                              "currentIssue",
                              "done",
                              //поля которые нужно брать новыми всегда
                              "alwaysOrSometimes"
                          ]
                        : []
                );
                stack.splice(i, 1); // убираем найденый
                break;
            }
        }
    });
    // раскоментить чтобы тестить
    // console.log("[reCreateList] старые данные", data);
    // console.log("[reCreateList] новые данные", result);
    return result;
}

export function createDataFromPath(dataObject) {
    let copyWithPathData = [];
    dataObject.forEach((x, index) => {
        copyWithPathData[index] = {
            code: x.code,
            text: x.text,
            data: {}
        };
        if (x.data?.path?.length > 0)
            x.data.path.forEach(key => {
                if (x.data[key]) {
                    //делаем копию всех блоков что есть в истории (если они есть)
                    let data = createCopy(x.data[key]); // полная копия ответа

                    // если это блок 2 то нужно пройти path каждого - от обратного удалим чего нет
                    if (key === QuizGoToBlock) {
                        data.forEach(item => {
                            Object.keys(item).forEach(key2 => {
                                if (
                                    key2.startsWith("Quiz") &&
                                    !item.path?.includes(key2)
                                )
                                    delete item[key2];
                            });
                            // можно удалить лишние блоки
                            delete item["done"];
                            delete item["id"];
                            delete item["quizes"];
                            delete item["path"];
                            delete item["currentIssue"];
                        });
                    }
                    copyWithPathData[index].data[key] = data;
                }
            });
    });
    // вернули готовую для экспорта структуру
    // console.info(copyWithPathData);
    return copyWithPathData;
}
