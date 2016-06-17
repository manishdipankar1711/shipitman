var shippable = (function (shippable) {

    var currentPageNo = 1; // Need to track it as github doesn't give all open issues at once.
    var pathname = ""; // this is shared across 2 function, so kept outside.
    var lessThan24 = 0; // this is shared.
    var moreThan7Day = 0; // this is shared.
    var between24and7 = 0; // this is shared.
    var caption = ""; // This is to display th caption in table...

    myajax = function(params ){

      /*
        This is the ajax call which hits the API.
        1. This is called once when user clicks "Submit query" button.
        2. This gets called from callback of above ajax call as long as there are items left ...
        3. So, if there are 623 issues open, then this will get called 6 or 7 times ....

      */

      var pathname = params.path;
      var data = {"state" : "open", "sort":"created", "direction":"desc" }
      data.page = params.page;
      data.per_page = params.per_page || 100;
      var callback = params.callback || null;

      $.ajax({
          url: "https://api.github.com/repos/" + pathname +"/issues",
          dataType: "json",
          data : data,
          type : "GET",
          success: function (resp, XMLHttpRequest ){
              if( resp ) {
                  callback(resp);
              }else {
                handleError();
              }
          },
          error : function(XMLHttpRequest, textStatus, errorThrown){
            handleError();
          }
      });

    }

    shippable.search = function(){

      /*
        This function gets called when enter is pressed or when
        button is clicked after writing the url..
      */

      var url = $("#queryInp").val();
      if( url && url.trim() ){
          url = url.trim();
          $("#openIssueList").html("");
          var parser = document.createElement('a');
          parser.href = url;
          pathname = parser.pathname;
          if( pathname && pathname.endsWith("/issues")  ) {
              pathname = pathname.replace("issues","");
          }

          if ( pathname ){
            pathname = pathname.replace(/^\/|\/$/g, '');
            if( pathname ){
              $("#warningDiv").hide();
              currentPageNo = 1; // resetting it for new url's  ...
              lessThan24 = 0;// resetting it for new url's  ...
              moreThan7Day = 0;// resetting it for new url's  ...
              between24and7 = 0;// resetting it for new url's  ...
              caption = "";// resetting it for new url's  ...

              $("#loadingIcon").show();
              var html = "We are calculating the open issues statistics.... Keep calm and wait for the statistics ...";
              $("#openIssueList").html(html);

              myajax({"path" : pathname, "callback" : paintopenIssues, "page" : currentPageNo, "per_page" : 100, "type" : "issue" })
            }
          }
      }

      return false;
    }

    handleError = function(){
      /*
        Error handling if anything fails..
        This is to make sure a smoother user experience...
      */
      $("#warningDiv").show();
      $("#loadingIcon").hide();
      $("#openIssueList").html("");
    }

    paintopenIssues = function(resp){
      /*
        This is the template which is combined with data to paint the html table dynamically...
       */
      if( !resp ){
        handleError();
        return ;
      }

      if( resp && resp.length  ){
        if ( !caption ){
          caption = resp[0].url.split("issues")[0].split("repos")[1];
        }
        // this is to make another call since pagination allows a maximum of 100 results ...
        currentPageNo += 1;
        myajax({"path" : pathname,
          "callback" : paintopenIssues,
          "page" : currentPageNo,
          "per_page" : 100,
          "type" : "issue"
        });

        var currTime =  new Date().getTime();

        resp.map(function(cv, index ) {

          var eventTime = new Date(cv.created_at).getTime();
          if( currTime - eventTime <= 86400000 ){
            lessThan24 += 1;
          } else if ( (currTime - eventTime > 86400000 ) && (currTime - eventTime <= 604800000) ){
            between24and7 += 1;
          } else if ( currTime - eventTime > 604800000 ){
            moreThan7Day += 1;
          } else  {
            alert('Whaaaat????????????')
          }
        });
      } else {
          var html="";
          if( lessThan24 > 0 ||  between24and7 > 0 || moreThan7Day > 0 ){
              html += "    <div id='openIssueList' class='table-responsive'>";
              html += "      <table class='table table-striped table-condensed table-bordered  table-hover'>";
              if( caption ){
                html += "      <caption>Statistics for "+ caption +"</caption>";
              }

              var totalOpenIssuesCount = lessThan24 + between24and7 + moreThan7Day;

              html += "        <tr>";
              html += "          <th>Total number of open issues</th>";
              html += "          <td id='totalOpenIssues'>"+totalOpenIssuesCount+"</td>";
              html += "        </tr>";

              html += "        <tr>";
              html += "          <th>Number of open issues that were opened in the last 24 hours</th>";
              html += "          <td id='openIssuesOpenedInLast24Hours'>"+lessThan24+"</td>";
              html += "        </tr>";
              html += "        <tr>";
              html += "          <th>Number of open issues that were opened more than 24 hours ago but less than 7 days ago</th>";
              html += "          <td id='openIssuesOpenedMoreThan24HoursAgoButLessThan7DaysAgo'>"+between24and7+"</td>";
              html += "        </tr>";
              html += "        <tr>";
              html += "          <th>Number of open issues that were opened more than 7 days ago</th>";
              html += "          <td id='openIssuesOpenedMoreThan7DaysAgo'>"+moreThan7Day+"</td>";
              html += "        </tr>";
              html += "      </table>";
              html += "  </div>";
          }else {
            html += "There were no open issues found for the project ... ! Bravo to the project guy !";
          }
          $("#openIssueList").html(html);
          $("#loadingIcon").hide();
      }


    }

  return shippable;
}(shippable || {}));


$('document').ready(function(){
  $('#queryInp').keypress(function(ev){
    /*
      Show statistics both on enter and click of submit button.
    */
    if (ev.which === 13){
      shippable.search();
    }
  });
});

