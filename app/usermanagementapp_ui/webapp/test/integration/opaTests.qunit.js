sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'usermanagementappui/test/integration/FirstJourney',
		'usermanagementappui/test/integration/pages/incidentsList',
		'usermanagementappui/test/integration/pages/incidentsObjectPage'
    ],
    function(JourneyRunner, opaJourney, incidentsList, incidentsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('usermanagementappui') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheincidentsList: incidentsList,
					onTheincidentsObjectPage: incidentsObjectPage
                }
            },
            opaJourney.run
        );
    }
);