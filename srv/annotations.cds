using usermanagementapp_services as um from './usermanagementapp-services';

annotate um.incidents with @odata.draft.enabled : true;

annotate um.users with {
    bname   @title : '{i18n>bname}';
    name_text @title : '{i18n>name_text}'
}

annotate um.incidents with {
    ID          @title : '{i18n>ID}'
                @readonly;
    ticket_no   @title : '{i18n>Ticket_No}'
                @readonly;
    system      @title : '{i18n>System}';
    client      @title : '{i18n>Client}';
    @Common.ValueListWithFixedValues : false
    @Common.ValueList : {
        CollectionPath : 'users',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'targetid',
                ValueListProperty : 'userid',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'fullname',
            }
        ],
    }
    targetid    @title : '{i18n>Targetid}';
    approverid  @title : '{i18n>Approverid}'
                @readonly;
    status      @title : '{i18n>Status}'
                @readonly;
    description @title : '{i18n>Description}';
    createdBy   @title : '{i18n>CreatedBy}';
    createdAt   @title : '{i18n>CreatedAt}';
    modifiedBy  @title : '{i18n>ModifiedBy}';
    modifiedAt  @title : '{i18n>ModifiedAt}';
};

annotate um.incidents with @UI : {
    HeaderInfo          : {
        TypeName       : '{i18n>Incident}',
        TypeNamePlural : '{i18n>Incidents}',
        Title          : {Value : ticket_no},
        Description    : {Value : description}
    },
    SelectionFields  : [
        ticket_no,
        targetid
        // targetid_bname
    ],

    Facets        : [
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>Details}',
            Target : '@UI.FieldGroup#Details'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>Admin}',
            Target : '@UI.FieldGroup#Admin'
        }
    ],

    FieldGroup #Details : {Data : [
        {Value : ticket_no},
        {Value : description},
        {Value : system},
        {Value : client},
        {Value : targetid},
        // {Value : targetid_bname},
        {Value : approverid},
        {Value : status}
    ]},
    
    FieldGroup #Admin   : {Data : [
        {Value : ID},
        {Value : createdBy},
        {Value : createdAt},
        {Value : modifiedBy},
        {Value : modifiedAt}
    ]},

    LineItem : [
        {Value : ticket_no},
        {Value : description},
        {Value : system},
        {Value : client},
        {Value : targetid},
        // {Value : targetid_bname},
        {Value : approverid},
        {Value : status},
        {Value : createdBy},
        {Value : createdAt}
    ]
};
