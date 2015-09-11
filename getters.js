var dockerhub        = require( './dockerhub.js'  );

function send_data(res, data) {
    var jdata = JSON.stringify(data);
    //var cs    = checksum(jdata);
    res.setHeader('Content-Type', 'application/json');
    res.send( jdata );
}

function get_repos (req,res) { 
    //'/repos/:username/'
    var username = req.params.username;

    console.log("getting repos from username", username);
    
    var data = { "username": username, "status": 1, "status_desc": "getting repos from username " + username }

    dockerhub.get_repos(username, false,
        function(repos) {
            if (!repos) {
                console.log("no repos");
                
                data.status      = 2;
                data.status_desc = "error getting list of repositories for username " + username;
                
                send_data(res, data)
                return;
            }
            
            data.status      = 0;
            data.status_desc = "succes";
            data.data        = repos;
            
            send_data(res, data)
        }
    );
}

function get_repo_info (req,res) { 
    //'/info/:username/:reponame/'
    var username       = req.params.username;
    var reponame       = req.params.reponame;
    var repo_name_full = username + "/" + reponame;
    
    console.log("getting info from repo", repo_name_full);
    
    var data = { "username": username, "reponame": reponame, "status": 1, "status_desc": "getting info from repo " + repo_name_full }
    
    dockerhub.get_repo_info(repo_name_full, false,
        function(info) {
            if (!info) {
                console.log("no info");
                
                data.status      = 2;
                data.status_desc = "error getting info for repository " + repo_name_full;
                
                send_data(res, data)
                return;
            }
            
            data.status      = 0;
            data.status_desc = "succes";
            data.data        = info;
            send_data(res, data)
        }
    );
}

function get_repo_history (req,res) { 
    //'/history/:username/:reponame/'
    var username       = req.params.username;
    var reponame       = req.params.reponame;
    var repo_name_full = username + "/" + reponame;
    
    console.log("getting history from repo", repo_name_full);

    var data = { "username": username, "reponame": reponame, "status": 1, "status_desc": "getting history from repo " + repo_name_full }
    
    dockerhub.get_build_history(repo_name_full, false,
        function(hist) {
            if (!hist) {
                console.log("no history");
                
                data.status      = 2;
                data.status_desc = "error getting history for repository " + repo_name_full;
                
                send_data(res, data)
                return;
            }
            
            data.status      = 0;
            data.status_desc = "succes";
            data.data        = hist;
            send_data(res, data)
        }
    );
}

function get_build_log (req,res) { 
    //'/log/:username/:reponame/:build_code'
    var username       = req.params.username;
    var reponame       = req.params.reponame;
    var build_code     = req.params.build_code;
    var repo_name_full = username + "/" + reponame;

    console.log("getting log from repo", repo_name_full, 'build', build_code);

    var data = { "username": username, "reponame": reponame, "buid_code": build_code, "status": 1, "status_desc": "getting log from repo " + repo_name_full + ' build ' + build_code }
    
    dockerhub.get_build_log(repo_name_full, build_code, false,
        function(logs) {
            if (!logs) {
                console.log("no logs");
                
                data.status      = 2;
                data.status_desc = "error getting logs for repository " + repo_name_full + " build " + build_code;
                
                send_data(res, data)
                return;
            }
            
            data.status      = 0;
            data.status_desc = "succes";
            data.data        = logs;
            send_data(res, data)
        }
    );
}


function update(req,res) { 
    dockerhub.clean_cache();
    res.json({'res': true});
}


function getter(req,res) { 
    var username = req.params.username;
    console.log("req"             , req.params)
    console.log("getting username", username  );

    var data = {
        "username": username,
        "status": 1,
        "status_desc": "getting data"
    };
    
    dockerhub.get_repos(username, false,
        function(repos) {
            if (!repos) {
                console.log("no repos");
                
                data.status      = 2;
                data.status_desc = "error getting list of repositories";
                
                send_data(res, data)
                return;
            }
            
            var repo_list      = repos.results;
            //   repo_list      = [ repos.results[1] ];
            console.log("# repos", repo_list.length);

            function info_getter(el, clbk) {
                var repo_name      = el.name;
                var repo_space     = el.namespace;
                var repo_name_full = repo_space + '/' + repo_name;

                dockerhub.get_repo_info(repo_name_full, false, clbk);
            };

            _get_from_list_serial(repo_list, 'info', 0, info_getter, false,
                function(status, msg){
                    if (!res) {
                        console.log("failed getting repository information");
                        data.status      = 3;
                        data.status_desc = "failed getting repository information. " + msg;
    
                        send_data(res, data)
                        return;
                    }
                    console.log("success getting repository information");
                    

                    function hist_getter(el, clbk) {
                        var repo_name      = el.name;
                        var repo_space     = el.namespace;
                        var repo_name_full = repo_space + '/' + repo_name;
        
                        dockerhub.get_build_history(repo_name_full, false, clbk);
                    };
                    
                    _get_from_list_serial(repo_list, 'history', 0, hist_getter, false,
                        function(status, msg){
                            if (!res) {
                                console.log("failed getting repository history");
                                data.status      = 4;
                                data.status_desc = "failed getting repository history. " + msg;
            
                                send_data(res, data)
                                return;
                            }
                    
                            var histories = [];
                            for ( var r in repo_list ) {
                                var rel = repo_list[r];
                                var rhi = rel.history.results;
                                console.log("repo_list #",r);
                                //console.log("repo_list #",r,rel);
                                
                                for (var h in rhi ) {
                                    rhi[h].name      = rel.name;
                                    rhi[h].namespace = rel.namespace;
                                    histories.push(rhi[h]);
                                }
                            }
                            //histories = [histories[0]];

                            function log_getter(el, clbk) {
                                var repo_name      = el.name;
                                var repo_space     = el.namespace;
                                var build_code     = el.build_code;
                                var repo_name_full = repo_space + '/' + repo_name;
                
                                dockerhub.get_build_log(repo_name_full, build_code, false, clbk);
                            };
                            
                            _get_from_list_serial(histories, 'log', 0, log_getter, false,
                                function(status, msg){
                                    if (!res) {
                                        console.log("failed getting build log");
                                        data.status      = 5;
                                        data.status_desc = "failed getting build log. " + msg;
                    
                                        send_data(res, data)
                                        return;
                                    }

                                    console.log("success getting build log");
                                    data.status      = 0;
                                    data.status_desc = "success";
                                    data.data        = repos;
                                    
                                    send_data(res, data)
                                    return;
                                }
                            );
                        }
                    );
                }
            );
        }
    );
}


function _get_from_list_serial(list, key, list_pos, func, no_cache, clbk) {
    var list_size = list.length;

    func(list[list_pos], 
        function(res) {
            if (!res) {
                console.log("no res");
                clbk(false, "error getting res")
                return;
            }
            console.log("got res");
            list[list_pos][key] = res;

            if ( list_pos == (list_size - 1) ) {
                console.log("got all data");
                clbk(true, "success getting all data", list_size);
            
            } else {
                console.log("getting next data. #", list_pos + 1, "/", list_size);
                _get_from_list_serial(list, key, list_pos + 1, func, no_cache, clbk);
            }
        }
    );
}

exports.getter           = getter;
exports.get_repos        = get_repos;
exports.get_repo_info    = get_repo_info;
exports.get_repo_history = get_repo_history;
exports.get_build_log    = get_build_log;
exports.update           = update;