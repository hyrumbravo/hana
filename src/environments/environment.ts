// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    globalUrl: '/database',
    apiIncludeDocs: '/_all_docs?include_docs=true',
    //Gatekeeper Auth
    authEmail: "admin@example.com",
    authPassword: "admin",
    defaultSetting: "a08d8d41eec011a460242b37bf000331", //default role
    otpService: {
        service_id: 'service_9xa5tni',
        template_id: 'template_aiy1q79',
        user_id: 'IlWUY8d9P8xkzAUDl',
        template_params: {}
    }
    /**
     * If default role doesn't exist, change defaultSetting you wish to set as default when users are registering from login page
    */
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
