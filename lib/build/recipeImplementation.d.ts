import { RecipeInterface, EventHandler, RecipePreAPIHookFunction } from "./types";
export default function RecipeImplementation(recipeImplInput: {
    preAPIHook: RecipePreAPIHookFunction;
    onHandleEvent: EventHandler;
    sessionExpiredStatusCode: number;
}): RecipeInterface;
