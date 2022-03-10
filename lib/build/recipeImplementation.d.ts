import { RecipeInterface, EventHandler, RecipePreAPIHookFunction, RecipePostAPIHookFunction } from "./types";
export default function RecipeImplementation(recipeImplInput: {
    preAPIHook: RecipePreAPIHookFunction;
    postAPIHook: RecipePostAPIHookFunction;
    onHandleEvent: EventHandler;
    sessionExpiredStatusCode: number;
}): RecipeInterface;
