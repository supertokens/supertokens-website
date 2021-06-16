import supertokens, { addAxiosInterceptors, signOut, getUserId } from "../";
import axios from "axios";

supertokens.addAxiosInterceptors(axios);
addAxiosInterceptors(axios);


supertokens.attemptRefreshingSession().then((b: boolean) => {
    console.log(b);
}).catch(err => {

});

supertokens.doesSessionExist().then((exists: boolean) => {
    console.log(exists);
}).catch(err => {

});

supertokens.signOut().then(() => {

}).catch(err => {

});

signOut().then(() => {

}).catch(err => {

});

supertokens.init({
    apiDomain: ""
});

supertokens.init({
    apiDomain: "",
    apiBasePath: "",
    autoAddCredentials: true,
    isInIframe: true,
    sessionExpiredStatusCode: 440,
    sessionScope: "",
    cookieDomain: "",
    override: {
        functions: (oI) => {
            return {
                ...oI,
                signOut: async (config) => {
                    return oI.signOut(config);
                }
            }
        }
    },
    onHandleEvent: async (context) => {

    },
    preAPIHook: async (context) => {
        return context;
    }
});

supertokens.getJWTPayloadSecurely().then(p => {

}).catch(err => {

});


supertokens.getUserId().then((id: string) => {

}).catch(err => {

});
getUserId().then((id: string) => {

}).catch(err => {

});