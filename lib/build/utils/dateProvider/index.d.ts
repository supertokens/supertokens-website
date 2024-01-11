import { DateProviderInterface, DateProviderInput } from "./types";
/**
 * A utility class for managing a reference to a DateProviderInterface, allowing customization of time-related operations.
 * This class is designed to address clock skew issues between the server and client by providing a consistent mechanism
 * for obtaining current time adjusted for clock skew.
 *
 * @class DateProviderReference
 */
export default class DateProviderReference {
    private static instance?;
    dateProvider: DateProviderInterface;
    constructor(dateProviderInput?: DateProviderInput);
    static init(dateProviderInput?: DateProviderInput): void;
    static getReferenceOrThrow(): DateProviderReference;
}
export { DateProviderReference };
