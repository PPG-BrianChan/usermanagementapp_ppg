const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const cds = require('@sap/cds');
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
        req.data.status = `Pending`;
        req.data.approverid = `V614944`;
        console.log(`Request details updated`);
    })

    srv.after('CREATE','incidents', async(req)=>{
        await createwf(req, users);
    })

    srv.on('updateApprovalStatus', async (req) => {
        console.log(`Received request from workflow with data:Object ID=${req.data.objectID},Decision=${req.data.decision}`)
        var updateStatus;
        if (req.data.decision == "Approve") {
            //Get Target ID
            let query = SELECT.from(incidents).columns("ID", "targetid").where({ ID: req.data.objectID });
            let selectResult = await cds.run(query);
            var targetID;
            var objectID;
            if (selectResult) {
                targetID = selectResult[0].targetid
                objectID = selectResult[0].ID
            }

            //Execute POST to on-prem
            var csrfToken;
            try {
                const conn = await cds.connect.to('ZAPI_C_USERMANAGEMENT');
                const postResult = await conn.send(
                    { method: 'POST', path: `/unlock?sap-client=505&userid='${targetID}'&$format=json` }
                )
                console.log('POST performed successfully')
                updateStatus = "Completed";
            }
            catch (error) {
                console.log(error.message);
                updateStatus = "Failed to process";
            }
        } else {
            updateStatus = 'Rejected'
        }

        try {
            const query_update_status = UPDATE(entity, { ID: req.data.objectID }).set({ status_code: updateStatus });
            await cds.run(query_update_status)
            console.log("Data updated successfully")
        } catch (error) {
            console.log(error.message);
        }
    })
}

const createwf = async (req, users) => {
    console.log("Preparing WF Payload");
    console.log('Getting approver email');

    // const url = initPath + `&$filter=(userid eq '${req.approverid}')`;
    // const response = await executeHttpRequest(
    //     {
    //         destinationName: "S4HANA_PSD_HTTPS_505_BR_Basic"//, jwt: jwt
    //     },
    //     {
    //         method: 'GET',
    //         url: url
    //     }
    // );
    // const approveremail = response.data.d.results[0].email.toLowerCase();

    const approveremail = 'cchan@ppg.com';

    console.log("Approver email is: ", approveremail);

    var subject = `Approval request for user management process - Ticket ${req.ticket_no};`

    //Create WF

    console.log("Sending Workflow Request");
    const payload = {
        "definitionId": "eu10.crossfunctional-dev-56c89xus.cfglbusermanagementprocess.userUnlock",
        "context": {
            "ticketno": req.ticket_no,
            "userid": req.targetid,
            "system": req.system,
            "client": req.client,
            "approver": approveremail,
            "subject": subject,
            "const_approve": "Approve",
            "const_reject": "Reject",
            "incidentid": req.ID
        }
    }

    try {
        const result = await executeHttpRequest(
            {
                destinationName: 'SBPA-Process_Trigger_Destination'
            },
            {
                method: 'POST',
                data: payload,
                headers: {
                    'content-type': 'application/json'
                }
            }
        )
        console.log('Success:', result.data)
    } catch (error) {
        console.log(error.message)
    }

    //Send Mail

    console.log("Sending Mail")
    var emailPayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": approveremail,
        "subject": `TESTING BTP Access Request: Incident ${req.ticket_no} to be approved`,
        "type": "HTML",
        "body": `You have received an approval request. Kindly proceed to the BTP Launchpad to complete the approval process at https://crossfunctional-dev-56c89xus.launchpad.cfapps.eu10.hana.ondemand.com/site/DEV#Shell-home.`
    }

    try {
        // console.log("Mail sending disabled for now");
        await executeHttpRequest(
            {
                destinationName: "Mail_Service_API"
            },
            {
                method: 'POST',
                data: emailPayload,
                url: "/mailrequests"
            }
        )
    }
    catch (error) {
        console.log(error.message);
        console.log("Error occured during mail sending, kindly check at application log or mail service");
    }
};

