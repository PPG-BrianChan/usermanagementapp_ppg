const { executeHttpRequest } = require('@sap-cloud-sdk/core');
const cds = require('@sap/cds');
const { retrieveJwt } = require('@sap-cloud-sdk/core');
const axios = require('axios');
const initPath = '/sap/opu/odata/sap/ZAPI_C_USERMANAGEMENT/ZC_USERMANAGEMENT?$format=json';

module.exports = (srv) => {
    const { incidents, users } = srv.entities;

    srv.on('READ', 'users', async (req) => {
        console.log("Getting user list");
        try {
            const users = await cds.connect.to('ZAPI_C_USERMANAGEMENT');
            return users.run(req.query);
        }
        catch (error) {
            console.log(error);
        }
    })

    srv.before('CREATE', 'incidents', async (req) => {
        console.log(`Before CREATE`);
        const query_get_ticketno = SELECT.one
            .from(incidents)
            .columns("max(ticket_no) as ticketno");
        const result = await cds.run(query_get_ticketno);
        const jsonobj = JSON.parse(JSON.stringify(result));
        var ticketno = `${jsonobj.ticketno} + 1`;
        req.data.ticket_no = JSON.stringify(eval(ticketno));
        req.data.status = `PENDING`;
        req.data.approverid = `V614944`;
        console.log(`Request details updated`);
        await createwf(req, users);

    })
}

const createwf = async (req, users) => {
    console.log("Preparing WF Payload");
    console.log('Getting approver email');

    const url = initPath + `&$filter=(userid eq '${req.data.approverid}')`;
    const response = await executeHttpRequest(
        {
            destinationName: "S4HANA_PSD_HTTPS_500_BR"//, jwt: jwt
        },
        {
            method: 'GET',
            url: url 
        }
    );
    const approveremail = response.data.d.results[0].email.toLowerCase();
    
    console.log("Approver email is: ",approveremail);

    const payload = {
        definitionId: "usermanagementapproval",
        context: {
            approvalrequest: {
                ticketno: req.data.ticket_no,
                userid: req.data.targetid,
                system: req.data.system,
                client: req.data.client,
                approver: approveremail
            }
        }
    };

    console.log("Sending Workflow Request");
    try {
        const response = await executeHttpRequest(
            {
                destinationName: "bpmworkflowruntime_oacc"
                // destinationName: "br_bpmworkflowruntime"
            },
            {
                method: 'POST',
                data: payload,
                url: "/rest/v1/workflow-instances"
            }
        );
        console.log(response.data);
    }
    catch (error) {
        req.info("Error during WF instance creation. Check with technical team for more details.")
        console.log(error);
    }
};

