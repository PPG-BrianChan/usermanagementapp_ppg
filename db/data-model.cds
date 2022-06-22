namespace usermanagementapp;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity incidents : cuid, managed{
    ticket_no : String(8);
    description : String;
    system      : String(3);
    client      : String(3);
    targetid    : String;//Association to users;
    approverid  : String;
    status      : String;
}

entity users{
    key userid : String;
    fullname : String;
    email : String;
}