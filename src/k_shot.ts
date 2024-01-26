import { Batch, Experiment, IRunner, Run } from 'experimentrunner/experimentManager'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs'
import OpenAI from 'openai'

export type IParams = {
    question: string,
    answer: string,
    choices: IKAnswer[],
    model: OpenAI.ChatCompletionCreateParams["model"],
}

export type IResult = {
    best_choice: IKAnswer,
}

export type IKAnswer = {
    message: ChatCompletionMessageParam,
    answer: string,
    question: {
        question: string,
        answer: string,
    },
}

type InputFile = {
    data: {
        question: {
            question: string,
            answer: string,
        },
        k: number,
        model: string,
    },
    answer: IKAnswer[]
}[]

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//This runner nedds to select the best choice from the choices given the question provided
const choice_select_runner: IRunner<IParams, IResult> = {
    setup: async (run) => {
        run.context = [
            {
                role: "system",
                content: "Select the best answer for the question: " + run.data.choices[0].question.question,
            },
            ...(run.data.choices.map((c, i) => ({
                role: "user" as const,
                content: `${i}:
                REASONING:
                ${c.message.content}
                ANSWER:
                ${c.answer}`,
            }))),
            {
                role: "system",
                content: "Your choice (output only the choice number):",
            },
        ]
        return true
    },
    step: async (run) => {
        const res = await openai.chat.completions.create({
            messages: run.context,
            model: run.data.model,
        });
        const output = res.choices[0].message.content;
        try {
            const choice = parseInt(output ?? "");
            if (choice >= 0 && choice < run.data.choices.length) {
                run.answer = {
                    best_choice: run.data.choices[choice],
                }
                return false
            }
        } catch (e) {
            run.log("Error parsing choice: " + output);
        }
        return false
    },
    evaluate: async (run) => {
        const correct = run.answer?.best_choice.answer === run.data.choices[0].question.answer;
        return correct ? "CORRECT" : "INCORRECT";
    }
}

async function loadRuns(exp: Experiment<IParams, IResult>, file: string, k: number) {
    const json = await Bun.file(file).json<InputFile>();
    const runs = json.map((data) => new Run(choice_select_runner, {
        question: data.data.question.question,
        answer: data.data.question.answer,
        choices: data.answer.slice(0, k),
        model: "gpt-4",
    }))
    exp.addBatch(new Batch("k_shot", runs));
}

let e = new Experiment<IParams, IResult>();
loadRuns(e, "./data/2d_answers_10.json", parseInt(Bun.argv[2]));

e.addLoadFunction(async (exp, file, string_k) => {
    const k = parseInt(string_k ?? "100");
    await loadRuns(exp, file, k);
});

e.startCommandLine();
