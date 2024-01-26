import { SerializedRun } from "experimentrunner/experimentManager";
import { IParams, IResult } from "./k_shot";

type Input = SerializedRun<IParams, IResult>;

const json = await Bun.file(Bun.argv[2]).json<Input[]>();
const input = json.filter((r) => r.status != "FAIL");

const n_correct = input.filter((r) => r.score == "CORRECT").length;
console.log(`Percentage Correct: ${n_correct *100 / input.length}`);
const f: Record<string, number> = {
}

input.forEach((r) => {
    const id = r.data.choices.findIndex((c) => c.message.content == r.answer?.best_choice.message.content);
    if (id in f) {
        f[id]++;
    }  else {
        f[id] = 1;
    }
});

console.log(`Choice frequencies: `);
Object.keys(f).forEach((k) => {
    console.log(`Choice ${k}: ${f[k]} (${(f[k]* 100 / input.length).toFixed(2)}%)`);
})

Object.keys(f).forEach((k) => {
    console.log(`${k}:${"|".repeat(Math.floor(f[k]/input.length * 100))}`);
})

const correct: Record<string, number> = {
}

input.forEach((r) => {
    r.data.choices.forEach((c, i) => {
        if (c.answer == r.data.answer) {
            if (i in correct) {
                correct[i]++;
            } else {
                correct[i] = 1;
            }
        }
    })
});

console.log(`Correct frequencies: `);
Object.keys(correct).forEach((k) => {
    console.log(`Choice ${k}: ${correct[k]} (${(correct[k]* 100 / input.length).toFixed(2)}%)`);
})
Object.keys(correct).forEach((k) => {
    console.log(`${k}:${"|".repeat(Math.floor(correct[k]/input.length * 100))}`);
})


