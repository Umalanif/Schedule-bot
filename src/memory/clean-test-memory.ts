import { deleteTestMemoryFact } from "./maintenance";

const summary = deleteTestMemoryFact();

console.log(JSON.stringify(summary, null, 2));
