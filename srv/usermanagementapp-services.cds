using usermanagementapp as uman from '../db/data-model';
// using ZC_USERS_CDS as users_ext from './external/ZC_USERS_CDS.csn';

service usermanagementapp_services {
    @requires : 'authenticated-user'
    @Capabilities.Insertable : true
    @Capabilities.Updatable  : true
    @Capabilities.Deletable  : true
    entity incidents as projection on uman.incidents;

    // @readonly
    // // @requires : 'authenticated-user'
    // entity users as projection on users_ext.ZC_USERS {
    //     key bname, name_text
    // }
}
