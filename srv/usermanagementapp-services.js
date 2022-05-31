const { executeHttpRequest } = require('@sap-cloud-sdk/core');
const cds = require('@sap/cds');

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
    })

    srv.after('CREATE', 'incidents', async (req, msg) => {
        console.log("Start of after create");
        console.log(msg.data);
        createwf(msg.data);
        // console.log("Start of AFTER hook");
        // sendmailrequest(msg.data);
    })

}

const createwf = async (incident) => {
    console.log("Preparing WF Payload");
    const payload = {
        definitionId: "usermanagementapproval",
        context: {
            approvalrequest: {
                ticketno: incident.ticket_no,
                userid: incident.targetid_bname,
                system: incident.system,
                client: incident.client
            }
        }
    };

    console.log("Sending Workflow Request");
    const response = await executeHttpRequest(
        {
            destinationName: "bpmworkflowruntime"
        },
        {
            method: 'POST',
            data: payload,
            url: "/rest/v1/workflow-instances"
        }
    );
    console.log(response.data);
};