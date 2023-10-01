using usermanagementapp as uman from '../db/data-model';
using { ZAPI_C_USERMANAGEMENT as external } from './external/ZAPI_C_USERMANAGEMENT';
// using ZC_USERS_CDS as users_ext from './external/ZC_USERS_CDS.csn';

service usermanagementapp_services //@(requires : 'authenticated-user')
{    
    @Capabilities.Insertable : true
    @Capabilities.Updatable  : true
    @Capabilities.Deletable  : true
    entity incidents as projection on uman.incidents;

    @readonly
    @cds.persistence : {
        table,
        skip: false
    }
    entity users as projection on external.ZC_USERMANAGEMENT
}

service api {
    entity incidents   as projection on uman.incidents;
    action updateApprovalStatus(objectID : String, decision : String);
}
