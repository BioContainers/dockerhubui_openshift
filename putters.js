var util      = require( 'util'           );
var dockerhub = require( './dockerhub.js' );
var logger    = require( './logger.js'    );


var db_mapper = {
    'dockerhub': callback_dockerhub
};


function init(app) {
    logger(1, 'configuring putting callback');
    logger(2, 'using mods      cache', app.mods.cacher.cache_id );
    logger(2, 'using dockerhub cache', dockerhub.cacher.cache_id);

    dockerhub.init(app);

    app.post(    '/callback/:dbname/'                      , callback );
}


function callback(req, res) {
    var dbname = req.params.dbname;
    logger(1, "callback :: Got POST: dbname:", dbname);
    //logger("callback :: Got POST:", util.inspect(req));
    
    if ( dbname in db_mapper ) { // in mapper
        if ( req.headers['content-type'] != 'application/json' ) {
                res.writeHead(500, {'Content-Type': 'text/html'});
                res.end('wrong type ('+req.headers['content-type']+'). only application/json accepted\n');
    
        } else { // json
            var bodyStr = '';
            
            req
                .on("data",
                    function(chunk){
                        bodyStr += chunk.toString();
                    }
                )
                .on("end",
                    function(){
                        var body = JSON.parse(bodyStr);
                        req.body = body;
                        db_mapper[dbname](req, res);
                    }
                );
        }
    } else { // not in mapper
        res
            .status(404)
            .json({ 'error': 'unknown endpoint ('+dbname+'). valid are: ' + Object.keys(db_mapper) });
    }
}


function callback_dockerhub(req, res) {
    //logger("callback :: Got POST: dockerhub:"      , util.inspect(req));
    logger(1, "callback :: Got POST: dockerhub");
    logger(2, "callback :: Got POST: dockerhub. body:", JSON.stringify(req.body));

    process_dockerhub_data(req.app, req.body);

    res.json( req.body );
}


function process_dockerhub_data(app, data) {
        //console.log('processing dockerhub data: ', data);
        logger(1, 'processing dockerhub data');

        logger(3, 'processing dockerhub data: ', data);
        
        var namespace    = data.repository.namespace;
        var name         = data.repository.name;
        var repo_name    = data.repository.repo_name;
        var callback_url = data.callback_url;

        logger(2, 'processing dockerhub data: namespace:', namespace);
        logger(2, 'processing dockerhub data: name     :', name     );
        logger(2, 'processing dockerhub data: repo name:', repo_name);

        var no_cache = true;

        app.mods.getters.get_all_username(namespace, app, no_cache,
            function get_all_username_callback(data) {
                if ( data.status == 1 ) {
                    var repos  = data.data;
                    var nrepos = JSON.parse(JSON.stringify(repos));
                    nrepos.results = [];
                    
                    logger(3, 'processing dockerhub data: repos:', repos);
                    
                    for ( var r in repos.results ) {
                        var repo = repos.results[r];
                        logger(3, 'processing dockerhub data: repo:', r);
                        if ( repo.namespace == namespace && repo.name == name ) {
                            logger(2, 'processing dockerhub data: repo:', r, 'VALID', repo);
                            nrepos.results.push(repo);
                        }
                    }
                    
                    logger(3, 'processing dockerhub data: nrepos:', nrepos);
                    
                    
                    app.mods.getters.get_all_repo(namespace, nrepos, app, no_cache,
                        function(data) {
                            //console.log('processing dockerhub data: all data:', JSON.stringify(data));
                            let_dockerhub_know(callback_url, true);
                        }
                    );
                    
                } else {
                    let_dockerhub_know(callback_url, false);
                }
            }
        );


        
        //dockerhub.get_all_repo(namespace, repos, app, no_cache, callback)
        
        /*
        var clbk_success = function (images, repo_tags, img_id, img_json, img_ancestry, build_info, build_history, build_log) {
                store_data(data, images, repo_tags, img_id, img_json, img_ancestry, build_info, build_history, build_log, let_dockerhub_know);
        };
        */
}


function let_dockerhub_know(callback_url, status) { 
    dockerhub.webhook_callback( callback_url, status );
}


/*
repos { next: null,
  previous: null,
  results: 
   [ { user: 'biodckr',
       name: 'comet',
       namespace: 'biodckr',
       status: 1,
       description: 'an open source tandem mass spectrometry sequence database search tool',
       is_private: false,
       is_automated: true,
       can_edit: false,
       star_count: 0,
       pull_count: 13,
       last_updated: '2015-09-04T13:47:52.458289Z' } ],
  cache_time: 1442605595659 }
*/


/*
putters.js : 70 : dockerhub:: processing dockerhub data:  { push_data: { pushed_at: 1440632525, images: null, pusher: 'sauloal' },
  callback_url: 'https://registry.hub.docker.com/u/sauloal/introgressionbrowser/hook/2a3b0iibgid2g44acdda0h2c03ghibjf4/',
  repository: 
   { status: 'Active',
     description: 'Introgression browser - standalone',
     is_trusted: true,
     full_description: 'See description at:\r\n\r\nhttp://sauloal.github.io/introgressionbrowser/\r\n',
     repo_url: 'https://registry.hub.docker.com/u/sauloal/introgressionbrowser/',
     owner: 'sauloal',
     is_official: false,
     is_private: false,
     name: 'introgressionbrowser',
     namespace: 'sauloal',
     star_count: 0,
     comment_count: 0,
     date_created: 1424919950,
     dockerfile: '#docker run -it --security-context -v $PWD:/var/www/ibrowser -v $PWD/data:/var/www/ibrowser/data -v $PWD/access.log:/var/log/apache2/access.log -v $PWD/error.log:/var/log/apache2/error.log sauloal/introgressionbrowser\n#--security-context apparmor:unconfine \n#docker build --rm -t sauloal/introgressionbrowser .\n\nFROM sauloal/introgressionbrowser_runtime\n\nRUN cd /var/www && git clone https://github.com/sauloal/introgressionbrowser.git ibrowser\n\nWORKDIR /var/www/ibrowser\n\n',
     repo_name: 'sauloal/introgressionbrowser' } }
*/

exports.init = init;