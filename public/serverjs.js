function loginOrCreateAgent() {
    var agentCodeName = $("#agent_code_name").val();
    $.ajax({
        url: "http://localhost:3000/agents",
        type: "POST",
        data: "agent[code_name]=" + agentCodeName,
        success: function(data) {
            alert("success")
            console.log(data)
        }
    });
}