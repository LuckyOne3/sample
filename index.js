import Vue from "vue";
import Vuex from "vuex";
import router from "@/router";
import ScenarioService from "@/api/http/services";
import ScenarioProfiles from "@/api/http/profiles";
import ScenarioProjects from "@/api/http/projects";
import { nextIssue, nextIssueBlock2 } from "@/store/nextMiniQuiz";

// Во-первых, давай не путать друг друга и не плодить сущности.
// Не надо делать проекты, таблицу проектов, а потом обзывать эту модель quiz

// У нас есть PROJECT (quiz, опросник, проект и т.д.), есть SERVICE (услуга)
// есть PROFILE (но это просто профиль - на него ссылка из SERVICE)
// И также есть PROJECT_SERVICE - это чёткая услуга в рамках проекта со своим ответом (DATA)

// константы
import {
    Quiz000,
    QuizGoToBlock,
    QuizChooseOption,
    QuizBlockEnd,
    QuizEnd
} from "@/store/createList";

Vue.use(Vuex);

function SetRoute(project_id, service_id, option_id) {
    let path =
        `/quiz/${project_id}/services/${service_id}` +
        `${option_id ? "/" + option_id : ""}`;
    // подменяем роут без навигации
    if (router.history.current.path != path)
        return router.replace({ path }).catch(() => {});
    else return true;
}
function ScrollUp() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

export default new Vuex.Store({
    strict: true,
    state: {
        // общие данные
        services: [],
        profiles: [],
        projects: [],
        // проект
        project: {},
        start_quiz: Quiz000,
        // текущая услуга
        currentService: {
            project_id: null,
            service_id: null,
            code: "",
            text: "",
            option_id: null,
            data: {}
        },
        // флаг загрузки вопроса
        quiz_loadig: false,
        // флаг отправка ответа
        quiz_updating: false,
        // текущий статус
        status: "",
        // пулл ошибок
        errorStatus: []
        // у нас в store должен быть проект
        // внутри проекта всегда будет project_services со своими data
    },
    mutations: {
        // добавляем ошибку в пулл
        PUSH_ERROR(state, error) {
            state.errorStatus.push(error);
            state.status = error;
            console.error("[PUSH_ERROR]", error);
            // покажем ошибку красиво
            Vue.$toast.error(error, {
                timeout: 3000,
                icon: true
            });
        },
        // чистим пулл ошибок
        POP_ERROR(state) {
            state.errorStatus.pop();
            if (state.errorStatus?.length > 0)
                state.status = state.errorStatus[state.errorStatus.length - 1];
            else state.status = "";
        },
        SET_LOADING(state, loading) {
            state.quiz_loadig = !!loading;
        },
        SET_UPDATING(state, updating) {
            state.quiz_updating = !!updating;
        },
        // все данные по проекту
        SET_PROJECT(state, payload) {
            // сортируем по коду услуги
            if (payload?.project_services) {
                payload.project_services.sort((e1, e2) =>
                    e1.code?.localeCompare(e2.code)
                );
            }
            Vue.set(state, "project", payload);
        },
        SET_PROJECT_ID(state, project_id) {
            state.currentService.project_id = project_id;
            if (!project_id) {
                state.currentService.service_id = null;
                state.currentService.option_id = null;
                state.currentService.code = "";
                state.currentService.text = "";
            }
        },
        SET_SERVICE_ID(state, service_id) {
            state.currentService.service_id = service_id;
            if (!service_id) {
                state.currentService.option_id = null;
            } else {
                let serv = state.project.project_services?.find(
                    x => x.id == service_id
                );
                // прокинем расшифровку услуги из описание проекта
                if (serv) {
                    state.currentService.code = serv.code;
                    state.currentService.text = serv.text;
                }
            }
        },
        SET_OPTION_ID(state, option_id) {
            state.currentService.option_id = option_id;
        },

        // справочник услуги
        SET_SERVICES(state, services) {
            Vue.set(state, "services", services);
        },
        // справочник профиля
        SET_PROFILES(state, profiles) {
            Vue.set(state, "profiles", profiles);
        },
        // проекты
        SET_PROJECTS(state, projects) {
            Vue.set(state, "projects", projects);
        },
        // переход назад по клику на в вопросе
        GO_BACK(state) {
            let option_id = state.currentService.option_id;
            let data =
                option_id || option_id === 0
                    ? state.currentService.data[QuizGoToBlock]?.[option_id]
                    : state.currentService.data;

            if (data.path?.length > 0) {
                data.currentIssue = data.path.pop();
                Vue.set(data, "path", data.path);
                data.done = false;
            } else {
                state.currentService.option_id = null;
                SetRoute(
                    state.currentService.project_id,
                    state.currentService.service_id,
                    state.currentService.option_id
                );
            }
            // state.currentService.data.currentIssue = state.currentService.data.path.pop();
        },
        // переход на вопрос из истории по клику на бар справа экрана
        GO_BACK_TO(state, quizKey) {
            let option_id = state.currentService.option_id;
            let data;
            let path;

            if (option_id || option_id === 0)
                data = state.currentService.data[QuizGoToBlock]?.[option_id];
            else data = state.currentService.data;

            path = [...data.path];
            let i = path.indexOf(quizKey);
            // есть ключ в пути то идём до него
            if (i >= 0) {
                path.splice(i);
                data.currentIssue = quizKey;
                Vue.set(data, "path", path);
                data.done = false;
            }
        },
        SET_QUIZ_DONE(state) {
            state.currentService.data.done = true;
        },
        // снимаем готовность опроса по текущей услуге
        SET_SERVICE_UNDONE(state) {
            state.currentService.data.done = false;
            // обновить статус в списке проектов
            if (state.project?.project_services) {
                let i = state.project.project_services.findIndex(
                    el => el.id == state.currentService.service_id
                );
                if (i >= 0) state.project.project_services[i].done = false;
            }
        },
        // Обновление данных по активной услуге в хранилище
        SET_OR_UPDATE_PROJECT_WITH_SERVICE(state, payload) {
            let formattedData = payload?.data;
            // сброс по умолчанию если данных нет
            if (!formattedData?.currentIssue) {
                formattedData = {
                    code: state.currentService.code,
                    text: state.currentService.text,
                    done: 0,
                    path: [],
                    currentIssue: state.start_quiz
                };
            }
            // определяем какой следующий вопрос
            if (!formattedData.path.includes(QuizGoToBlock)) {
                formattedData.currentIssue = nextIssue(formattedData);
            } else {
                const option_id = state.currentService.option_id;
                if (!option_id && option_id !== 0)
                    formattedData[QuizGoToBlock][option_id] = QuizChooseOption;
                else
                    formattedData[QuizGoToBlock][
                        option_id
                    ].currentIssue = nextIssueBlock2(
                        formattedData[QuizGoToBlock][option_id]
                    );
            }

            // установить данные по текущему вопросу
            Vue.set(state.currentService, "data", formattedData);

            // данные обновлены
            state.quiz_loadig = false;
            state.quiz_updating = false;

            // обновить статус в списке проектов
            if (state.project?.project_services) {
                let i = state.project.project_services.findIndex(
                    el => el.id == state.currentService.service_id
                );
                if (i >= 0)
                    state.project.project_services[i].done = formattedData.done;
            }
        }
    },
    actions: {
        // очищаем последнюю ошибку
        CLEAR_LAST_ERROR: ({ commit }) => {
            commit("POP_ERROR");
        },
        SET_LOADING({ commit }, loading) {
            commit("SET_LOADING", loading);
        },
        // Установить проект по id
        SET_PROJECT_ACTION: ({ commit }, project_id) => {
            if (!project_id || isNaN(project_id)) {
                commit("SET_PROJECT_ID", null);
                commit("SET_PROJECT", null);
                return;
            } else
                return ScenarioProjects.InfoProject(project_id)
                    .then(projectData => {
                        commit("SET_PROJECT_ID", project_id);
                        commit("SET_PROJECT", projectData);
                    })
                    .catch(err => {
                        commit(
                            "PUSH_ERROR",
                            `Ошибка получения данных по проекту (${project_id}) : ${err}`
                        );
                        throw err;
                    });
        },
        SET_OPTION_ID_ACTION: ({ commit, getters }, option_id) => {
            commit("SET_OPTION_ID", option_id);
            SetRoute(getters.project_id, getters.service_id, getters.option_id);
        },
        SET_PROJECT_WITH_SERVICE_ACTION: async function(
            { commit, dispatch, getters },
            param
        ) {
            // получение данных по текущей услуге
            commit("SET_LOADING", 1);

            const project_id = param.project_id;
            const service_id = param.service_id;
            // Опция если есть (для БЛОК -2)
            const option_id = param.option_id || null;

            try {
                if (project_id != getters.project_id)
                    await dispatch("SET_PROJECT_ACTION", project_id);
                let ServiceData = await ScenarioProjects.ShowProjectWithService(
                    {
                        project_id,
                        service_id
                    }
                );
                commit("SET_PROJECT_ID", project_id);
                commit("SET_SERVICE_ID", service_id);
                commit("SET_OPTION_ID", option_id);

                commit("SET_OR_UPDATE_PROJECT_WITH_SERVICE", ServiceData);
                SetRoute(project_id, service_id, option_id);
                ScrollUp();
            } catch (err) {
                commit(
                    "PUSH_ERROR",
                    `Ошибка получения данных по услуге (${project_id}:${service_id}${
                        option_id ? ":" + option_id : ""
                    }) : ${err}`
                );
                throw err;
            } finally {
                commit("SET_LOADING", 0);
            }
        },
        // отправляем данные на сервер - результат возвращаем
        UPDATE_PROJECT_WITH_SERVICE_ACTION: async function(
            { getters, commit },
            quizData
        ) {
            if (!quizData) quizData = {};
            commit("SET_UPDATING", 1);
            const block2 = getters.isBlock2;

            const project_id = getters.project_id;
            const service_id = getters.service_id;
            const option_id = getters.option_id;

            try {
                // готовим для отправки полную копию
                let formattedData = JSON.parse(
                    JSON.stringify(getters.getQuizFullData)
                );
                // функция подготовки данных для отправки
                let foo = function(Data, nextIssueFunc, End) {
                    // переписываем новые ответы
                    for (let key of Object.keys(quizData))
                        Data[key] = quizData[key];
                    // добавили новый ключ в историю если его там небыло
                    Data.path = Data.path || [];
                    if (
                        !Data.path.includes(Data.currentIssue) &&
                        Data.currentIssue !== QuizEnd
                    )
                        Data.path.push(Data.currentIssue);
                    // определили следующий вопрос
                    Data.currentIssue = nextIssueFunc(Data);
                    // если пришли на финал - считаем завершённым
                    Data.done = Data.currentIssue === End;
                };

                if (!block2) foo(formattedData, nextIssue, QuizEnd);
                else {
                    if (
                        (!option_id && option_id !== 0) ||
                        formattedData[QuizGoToBlock].length < option_id
                    )
                        throw new Error("Не задан номер комбинации!");
                    foo(
                        formattedData[QuizGoToBlock][option_id],
                        nextIssueBlock2,
                        QuizBlockEnd
                    );
                }

                // отправка данных на сервер и возвращаем результат в хранилище
                let ServiceData = await ScenarioProjects.UpdateProjectWithService(
                    {
                        project_id,
                        service_id,
                        json: formattedData
                    }
                );
                // востановим данные объекта с сервера
                commit("SET_OR_UPDATE_PROJECT_WITH_SERVICE", ServiceData);
            } catch (err) {
                commit(
                    "PUSH_ERROR",
                    `Ошибка отправки данных по услуге (${project_id}:${service_id}${
                        option_id ? ":" + option_id : ""
                    }) : ${err}`
                );
                throw err;
            } finally {
                commit("SET_UPDATING", 0);
            }
        },
        // Идём на следующий вопрос (текущая услуга)
        GO_NEXT_ACTION: ({ dispatch }, data) =>
            dispatch(
                "UPDATE_PROJECT_WITH_SERVICE_ACTION",
                data?.key
                    ? {
                          [data.key]: data.val
                      }
                    : null
            ).then(() => ScrollUp()),
        // Идём в конец следующий вопрос (текущая услуга)
        GO_END_ACTION: ({ commit, dispatch }) => {
            commit("SET_QUIZ_DONE");
            return dispatch("GO_NEXT_ACTION");
        },
        // возвращаемся на прошлый вопрос из истории (текущая услуга)
        GO_BACK_ACTION: ({ commit }) => {
            commit("SET_SERVICE_UNDONE");
            commit("GO_BACK");
            ScrollUp();
        },
        // возвращаемся на заданный вопрос из истории (текущая услуга)
        GO_BACK_TO_ACTION: ({ commit }, quizKey) => {
            commit("SET_SERVICE_UNDONE");
            commit("GO_BACK_TO", quizKey);
            ScrollUp();
        },
        GO_FIRST_ACTION: async function({ dispatch, getters }) {
            let service_id = getters.getProject.project_services?.[0]?.id;
            if (service_id)
                return await dispatch("SET_PROJECT_WITH_SERVICE_ACTION", {
                    project_id: getters.project_id,
                    service_id
                });
            else
                throw new Error(
                    `Нет доступных услуг в анкете (${getters.project_id})`
                );
        },
        // Переход на следующую услугу!
        GO_NEXT_SERVICE_ACTION: async function({ dispatch, commit, getters }) {
            try {
                // сначала сохраняем, потом переход
                await dispatch("UPDATE_PROJECT_WITH_SERVICE_ACTION");
                // сделать переход на следующую услугу по списку
                let service_id = getters.service_id;
                let i = getters.getProject.project_services.findIndex(
                    el => el.id == service_id
                );
                if (
                    i >= 0 &&
                    i < getters.getProject.project_services.length - 1
                )
                    i = i + 1;
                else i = 0;
                if (i < getters.getProject.project_services.length)
                    service_id = getters.getProject.project_services[i].id;
                return await dispatch("SET_PROJECT_WITH_SERVICE_ACTION", {
                    project_id: getters.project_id,
                    service_id
                });
            } catch (err) {
                commit(
                    "PUSH_ERROR",
                    `Ошибка перехода на услугу (${getters.project_id}:${getters.service_id}) : ${err}`
                );
                throw err;
            }
        },
        // получаем справочник услуги
        SET_SERVICES_ACTION: ({ commit }) =>
            ScenarioService.Services()
                .then(projectData => {
                    commit("SET_SERVICES", projectData);
                })
                .catch(err => {
                    commit(
                        "PUSH_ERROR",
                        `Ошибка получения справочника услуг: ${err}`
                    );
                    commit("SET_SERVICES", []);
                    throw err;
                }),
        // получаем справочник профили
        SET_PROFILES_ACTION: ({ commit }) =>
            ScenarioProfiles.Profiles()
                .then(projectData => {
                    commit("SET_PROFILES", projectData);
                })
                .catch(err => {
                    commit(
                        "PUSH_ERROR",
                        `Ошибка получения справочника профилей: ${err}`
                    );
                    commit("SET_PROFILES", []);
                    throw err;
                }),
        // получаем проекты
        SET_PROJECTS_ACTION: ({ commit }) =>
            ScenarioProjects.Projects()
                .then(projectData => {
                    commit("SET_PROJECTS", projectData);
                })
                .catch(err => {
                    commit(
                        "PUSH_ERROR",
                        `Ошибка получения перечня проектов: ${err}`
                    );
                    commit("SET_PROJECTS", []);
                    throw err;
                })
    },
    getters: {
        getStatus: state => state.status,
        isBusy: state => state.quiz_loadig || state.quiz_updating,
        // справочники
        getServices: state => state.services,
        getProfiles: state => state.profiles,
        getProjects: state => state.projects,
        // проект
        getProject: state => state.project,
        // статус загрузки обновления вопроса
        getQuizLoading: state => state.quiz_loadig,
        getQuizUpdating: state => state.quiz_updating,
        // услуга
        getService: state => state.currentService,
        getQuizFullData: state => state.currentService.data,

        project_id: (_, getters) => getters.getService.project_id,
        service_id: (_, getters) => getters.getService.service_id,
        option_id: (_, getters) => getters.getService.option_id,
        // данные по анкете (зависит от этапа [isBlock2])
        getQuizData: (_, getters) => {
            if (getters.isBlock2) {
                return getters.getService.data[QuizGoToBlock]?.[
                    getters.option_id
                ];
            } else return getters.getService.data;
        },
        getCurrentIssue: (_, getters) =>
            getters.getQuizData?.currentIssue ||
            (getters.isBlock2 ? QuizChooseOption : Quiz000),

        getPath: (_, getters) => getters.getQuizData.path || [],

        // для Блока-2
        isBlock2: (_, getters) =>
            getters.getService.data.path?.includes(QuizGoToBlock) &&
            (getters.option_id || getters.option_id === 0)
    },
    modules: {}
});
