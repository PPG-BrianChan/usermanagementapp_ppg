const { executeHttpRequest } = require('@sap-cloud-sdk/core');
const cds = require('@sap/cds');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports = (srv) => {
    srv.before("CREATE", "incidents", async (req) => {
        console.log(`Before CREATE`);
        const { incidents } = srv.entities;
        const query_get_ticketno = SELECT.one
            .from(incidents)
            .columns("max(ticket_no) as ticketno");
        const result = await cds.run(query_get_ticketno);
        const jsonobj = JSON.parse(JSON.stringify(result));
        var ticketno = `${jsonobj.ticketno} + 1`;
        req.data.ticket_no = JSON.stringify(eval(ticketno));
        req.data.status = `PENDING`;
        req.data.approverid = `K009287`;
        console.log(`Request details updated`);
        createwf(req);
        
    })

    // srv.after('CREATE', 'incidents', async (each, msg) => {
        // console.log("Start of after create");
        // console.log(each);
        // console.log("msg");
        // console.log(msg.data);
        // createwf(msg.data);
        // console.log("Start of AFTER hook");
        // sendmailrequest(msg.data);
    // })

}

const createwf = async (req) => {
    console.log("Preparing WF Payload");
    const payload = {
        definitionId: "usermanagementapproval",
        context: {
            approvalrequest: {
                ticketno: req.data.ticket_no,
                userid: req.data.targetid,
                system: req.data.system,
                client: req.data.client,
                approver: "cchan@ppg.com"
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
    catch(error){
        req.info("Error during WF instance creation. Check with technical team for more details.")
        console.log(error);
    }
};


const sendmailrequest = async (incident) => {
    console.log("Incident Ticket No:", incident.ticket_no);
    const mailcontent = {
        sender: 'SAPCOEBTPGeneral@ppg.com',
        recipient: 'cchan@ppg.com',
        subject: 'Approval request requiring your attention',
        body: `Kindly login to your workflow inbox to approve or reject the User management ticket, ${incident.ticketno}`
    };

    const payjson = JSON.stringify(mailcontent);

    try {
        console.log("Preparing to send request");
        // const response = await executeHttpRequest(
        //     {
        //         destinationName: "Mail_Service_Api"
        //     },
        //     {
        //         method: 'POST',
        //         data: payjson,
        //         url: "/mailrequests"
        //     }
        // );
        // console.log(response.status);
    }

    catch (error) {
        // console.log("Error in sending request:", error.response.data.error.message)
        console.log("Error!!!!", error);
        return;
    }
    console.log("Mail sent successfully");

};