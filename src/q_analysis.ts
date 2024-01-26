import { getTable } from "../src/common";
import OpenAI from 'openai'

type Questions = {
   data: {
       question: {
           question: string,
           answer: string
       }
       k: number
       model: OpenAI.Model
   },
   answer: {
       message: OpenAI.ChatCompletionMessage,
       answer: string
   }[]
}[]

async function readJson<G>(path: string) {
    const file = Bun.file(path);
    const contents = await file.json();
    return contents as G;
}

const lin1d = await readJson<Questions>(Bun.argv[2]);

function evaluateTopAnswer(experiment: Questions, k: number) {
    return experiment.map((run) => {
        const answers = [...run.answer ?? []];
        const evaluatedAnswers = answers.splice(0, k).map(a => a.answer == run.data.question.answer ? "CORRECT" : "INCORRECT");
        return {
            someCorrect: evaluatedAnswers?.some(a => a == "CORRECT"),
            allCorrect: evaluatedAnswers?.every(a => a == "CORRECT"),
            randomCorrect: evaluatedAnswers?.[Math.floor(Math.random() * evaluatedAnswers.length)] == "CORRECT",
            firstCorrect: evaluatedAnswers?.[0] == "CORRECT",
        }
    });
}


function summaryRunnary(summ: ReturnType<typeof evaluateTopAnswer>) {
    const total = summ.length;
    const someCorrect = summ.filter(s => s.someCorrect).length;
    const allCorrect = summ.filter(s => s.allCorrect).length;
    const randomCorrect = summ.filter(s => s.randomCorrect).length;
    const firstCorrect = summ.filter(s => s.firstCorrect).length;

    return {
        IdealPercent: (100 * someCorrect) / total,
        FirstPercent: (100 * firstCorrect) / total,
        RandomPercent: (100 * randomCorrect) / total,
        WorstPercent: (100 * allCorrect) / total,
    }
}

const _1d: Record<string, any> = { };

for (let i = 1; i <= 10; i++) {
    _1d[i] = summaryRunnary(evaluateTopAnswer(lin1d, i));
}

console.log("Results");
getTable(_1d);
