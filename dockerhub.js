var request = require( 'request'    );
var cache   = require( './cache.js' );
var logger  = require('./logger.js' );

/*
 * WEB HUB API
 */
//https://hub.docker.com/v2/repositories/sauloal/
//https://hub.docker.com/v2/repositories/sauloal/lamp/
//https://hub.docker.com/v2/repositories/sauloal/lamp/buildhistory/
//https://hub.docker.com/v2/repositories/sauloal/lamp/buildhistory/bmotlodzftpxygxsdx4wxjc/

var CACHE_TIMEOUT_MINUTES = process.env.CACHE_TIMEOUT_MINUTES || 1440; //60 = 1h 1440 = 1 day
var CACHE_TIMEOUT         = CACHE_TIMEOUT_MINUTES * 1000 * 60;

var cacher = new cache.cache(CACHE_TIMEOUT);


function get_repos(username, no_cache, clbk) {
    logger('dockerhub.get_repos: username', username, 'no_cache', no_cache);
    var cache_name = 'repos';
    var cache_key  = username;
    var func       = get_repos;
    if (!no_cache) {
        cacher.get(cache_name, cache_key, 
            function(val) {
                if ( val ) {
                    clbk( true, val );
                    return;

                } else {
                    func(username, true, clbk);
                    return;

                }
            }
        );
        return;
    }

    request.get({"url": "https://hub.docker.com/v2/repositories/"+username+"/?page_size=1000", "json": true},
        function (error, response, data) {
            if (error) {
                logger('dockerhub.get_repos: username', username, 'no_cache', no_cache, "error getting repos", error, data);
                clbk( false, null );
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger('dockerhub.get_repos: username', username, 'no_cache', no_cache, "error getting repos. wrong type", response.headers['content-type'], data, response.request.uri.path);
                clbk( false, null );
                return;
            }
            
            //logger("success getting repos", response.request.uri.path, repos);
            logger('dockerhub.get_repos: username', username, 'no_cache', no_cache, "success getting repos", response.request.uri.path);
            //logger("success getting repos", response.headers);

            //{"next": "https://hub.docker.com/v2/repositories/sauloal/?page=2", "previous": null, "results": [{"user": "sauloal", "name": "kivy", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": false, "can_edit": false, "star_count": 0, "pull_count": 38, "last_updated": "2014-04-23T16:54:03Z"}, {"user": "sauloal", "name": "gateone", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 12, "last_updated": "2014-09-10T22:17:30.239514Z"}, {"user": "sauloal", "name": "ajenti", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 50, "last_updated": "2014-09-12T22:27:59.454820Z"}, {"user": "sauloal", "name": "shipyard", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": false, "can_edit": false, "star_count": 0, "pull_count": 18, "last_updated": "2014-07-08T21:26:50Z"}, {"user": "sauloal", "name": "shipyardauto", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 14, "last_updated": "2014-07-08T21:48:06Z"}, {"user": "sauloal", "name": "supervisor", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 19, "last_updated": "2014-07-08T22:22:31Z"}, {"user": "sauloal", "name": "allbio", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 10, "last_updated": "2014-07-08T23:09:50Z"}, {"user": "sauloal", "name": "mongo", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 18, "last_updated": "2014-07-08T22:53:45Z"}, {"user": "sauloal", "name": "mongoapi", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 24, "last_updated": "2014-07-08T23:15:43Z"}, {"user": "sauloal", "name": "mongoapistats", "namespace": "sauloal", "status": 1, "description": "", "is_private": false, "is_automated": true, "can_edit": false, "star_count": 0, "pull_count": 18, "last_updated": "2014-07-13T14:53:49Z"}]}
            
            data.cache_time = (new Date()).getTime();
            cacher.set(cache_name, cache_key, data, function(err) {
                logger('dockerhub.get_repos: username', username, 'no_cache', no_cache, "saved to cache. err:", err);
                if (err) {
                }
                clbk( false, data );
            });
        }
    );
}


function get_repo_info(repo_name, no_cache, clbk) {
    var cache_name = 'info';
    var cache_key  = repo_name;
    var func       = get_repo_info;
    if (!no_cache) {
        cacher.get(cache_name, cache_key, 
            function(val) {
                if ( val ) {
                    clbk( true, val );
                    return;

                } else {
                    func(repo_name, true, clbk);
                    return;

                }
            }
        );
        return;
    }

    
    request.get({"url": "https://hub.docker.com/v2/repositories/"+repo_name+"/?page_size=1000", "json": true},
        function name(error, response, data) {
            if (error) {
                logger("error getting build info", error, data);
                clbk( false, null );
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting build info. wrong type", response.headers['content-type'], response.request.uri.path, data);
                clbk( false, null );
                return;
            }
            
            logger("success getting build info", response.request.uri.path);
            //logger("success getting build info", response.headers);

            data.cache_time = (new Date()).getTime();
            cacher.set(cache_name, cache_key, data, function(err) {
                if (err) {
                }
                clbk( false, data );
            });

            // { user: 'sauloal',
            //	name: 'introgressionbrowser',
            //	namespace: 'sauloal',
            //	status: 1,
            //	description: 'Introgression browser - standalone',
            //	is_private: false,
            //	is_automated: true,
            //	can_edit: false,
            //	star_count: 0,
            //	pull_count: 87,
            //	last_updated: '2015-08-26T23:42:10.094505Z',
            //	has_starred: false,
            //	full_description: 'See description at:\r\n\r\nhttp://sauloal.github.io/introgressionbrowser/\r\n' }
        }
    );
}


function get_build_history(repo_name, no_cache, clbk) {
    var cache_name = 'histo';
    var cache_key  = repo_name;
    var func       = get_build_history;
    if (!no_cache) {
        cacher.get(cache_name, cache_key, 
            function(val) {
                if ( val ) {
                    clbk( true, val );
                    return;

                } else {
                    func(repo_name, true, clbk);
                    return;
                    
                }
            }
        );
        return;
    }
    
    request.get({"url": "https://hub.docker.com/v2/repositories/"+repo_name+"/buildhistory/?page_size=1000", "json": true},
        function (error, response, data) {
            if (error) {
                logger("error getting build history", error, data);
                clbk( false, null );
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting build history. wrong type", response.headers['content-type'], data, response.request.uri.path);
                clbk( false, null );
                return;
            }
            
            logger("success getting build history", response.request.uri.path);
            //logger("success getting build history", response.request.uri.path, build_history);
            //logger("success getting build history", response);

            data.cache_time = (new Date()).getTime();
            cacher.set(cache_name, cache_key, data, function(err) {
                if (err) {
                }
                clbk( false, data );
            });

            //{ count: 46,
            // next: 'https://hub.docker.com/v2/repositories/sauloal/introgressionbrowser/buildhistory/?page=2',
            // previous: null,
            // results:
            //  [ { id: 1785682,
            //	  status: 10,
            //	  tag: 65567,
            //	  created_date: '2015-08-26T23:24:52.671099Z',
            //	  last_updated: '2015-08-26T23:42:06.660089Z',
            //	  build_code: 'bpqjxnii7c9blc8eyqwozyp' },
        }
    );
}


function get_build_log(repo_name, build_id, no_cache, clbk) {
    var cache_name = 'logs';
    var cache_key  = repo_name + "_" + build_id;
    var func       = get_build_log;
    if (!no_cache) {
        cacher.get(cache_name, cache_key, 
            function(val) {
                if ( val ) {
                    clbk( true, val );
                    return;

                } else {
                    func(repo_name, build_id, true, clbk);
                    return;
                    
                }
            }
        );
        return;
    }

    request.get({"url": "https://hub.docker.com/v2/repositories/"+repo_name+"/buildhistory/"+build_id+"/", "json": true},
        function (error, response, data) {
            if (error) {
                logger("error getting build log", error, data);
                clbk( false, null );
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting build log. wrong type", response.headers['content-type'], data, response.request.uri.path);
                clbk( false, null );
                return;
            }
            
            logger("success getting build log:", response.request.uri.path);
            //logger("success getting build log:", build_log, response.request.uri.path);
            //logger("success getting build log:", response.headers);
    
            data.cache_time = (new Date()).getTime();
            cacher.set(cache_name, cache_key, data, function(err) {
                if (err) {
                }
                clbk( false, data );
            });
            
            //{ id: 1785682,
            //  status: 10,
            //  tag: 65567,
            //  created_date: '2015-08-26T23:24:52.671099Z',
            //  last_updated: '2015-08-26T23:42:06.660089Z',
            //  build_results:
            //   { last_updated: '2015-08-26T23:42:06.038364',
            //	 logs: 'Client version: 1.6.1\nC															
            // Image successfully pushed\n',
            //     source_branch: 'master',
            //     dockerfile_contents: '#docker run -it --security-context -v $PWD:/var/www/ibrowser -v $PWD/data:/var/www/ibrowser/data -v $PWD/access.log:/var/log/apache2/acces
            //s.log -v $PWD/error.log:/var/log/apache2/error.log sauloal/introgressionbrowser\n#--security-context apparmor:unconfine \n#docker build --rm -t sauloal/introgression
            //browser .\n\nFROM sauloal/introgressionbrowser_runtime\n\nRUN cd /var/www && git clone https://github.com/sauloal/introgressionbrowser.git ibrowser\n\nWORKDIR /var/w
            //ww/ibrowser\n\n',
            //     callback_called_date: '2015-08-26T23:42:06.683',
            //     id: 1780776,
            //     callback_status_description: 'Called',
            //     server_name: 'p-worker-g0.highland.dckr.io',
            //     docker_repo: 'sauloal/introgressionbrowser',
            //     build_code: 'bpqjxnii7c9blc8eyqwozyp',
            //     priority: 3,
            //     status: 10,
            //     docker_user: 'sauloal',
            //		buildmetrics:
            //	{ uploaded: '2015-08-26T23:34:17.764Z',
            //	  built: '2015-08-26T23:34:17.346Z',
            //	  created: '2015-08-26T23:24:52.516Z',
            //	  started: '2015-08-26T23:31:48.976Z',
            //	  cloned: null,
            //	  readme: null,
            //	  finished: '2015-08-26T23:42:07.011Z',
            //	  error: null,
            //	  claimed: '2015-08-26T23:31:46.770Z',
            //	  bundled: '2015-08-26T23:34:17.926Z',
            //	  dockerfile: '2015-08-26T23:31:50.325Z',
            //	  failure: null },
            //   source_url: 'https://github.com/sauloal/introgressionbrowser.git',
            //   source_type: 'git',
            //   callback_log: '',
            //   docker_tag: 'latest',
            //   status_description: 'Finished',
            //   callback_status: 1,
            //   build_path: '/docker/introgressionbrowser',
            //   failure: null,
            //   created_at: '2015-08-26T23:24:52.484012',
            //   readme_contents: null,
            //   error: null,
            //   callback_url: 'https://registry.hub.docker.com/hooks/highland/build' } }
        }
    );
}


function webhook_callback(callback_url, status) {
    logger("calling back webhook");

    var form = {
        "state"      : status ? "success" : "failure",
        "description": "failed CI",
        "context"    : "biodocker dockerhub dashboard",
        "target_url" : "http://google.com"
    };
    
    logger("calling back webhook", form);
    
    request.post({"url": callback_url, "form": JSON.stringify(form), "header": { "Content-Type":"application/json; charset=UTF-8" }},
        function(error, response, body){
            if (error) {
                logger("error returning to dockerhub webhook", error, response.headers);
                return;
            }
            logger("success returning to dockerhub webhook", response.headers, body);
            
    });
}



/*
 * REPOSITORY API
 */
function _API_init_repo_token(clbk) {
    logger("_API_init_repo_token: THIS:", this,  "REPO NAME:", this.repo_name);
    var api_this = this;
	request.get({"url": "https://index.docker.io/v1/repositories/"+this.repo_name+"/images", "json": true, "headers": {"X-Docker-Token": true}},
		function (error, response, images) {
			if (error) {
				logger("error getting endpoint", error);
				clbk(null);
				return;
			}
			
			if (response.headers['content-type'] != "application/json") {
				logger("error getting endpoint. wrong type", response.headers['content-type'], response);
				clbk(null);
				return;
			}
			
			logger("success getting endpoint", response.request.uri.path);
			
            logger("_API_init_repo_token INSIDE: THIS:", api_this,  "REPO NAME:", api_this.repo_name);
			
			try {
				var endpoint = response.headers['x-docker-endpoints'];
				var token    = response.headers['x-docker-token'    ];

                api_this.endpoint = endpoint;
                api_this.token    = token;
                api_this.header   = {'Authorization': 'Token ' + token};
				//logger("success getting endpoint", response.headers);
				//logger("success getting endpoint uri", endpoint);
				//logger("success getting endpoint token", token);
			    
			} catch(e) {
				logger("error getting endpoint. no header", response.headers, response.headers['x-docker-endpoints'], response.headers['x-docker-token'], e);
				clbk(null);
                return;
                
			}
            
            api_this.images = images;
            
            clbk(true);
        }
    );
}


function _API_get_repo_tags(clbk){
    request.get({"url": "https://"+this.endpoint+"/v1/repositories/"+this.repo_name+"/tags", "json": true, "headers": this.header},
        function name(error, response, repo_tags) {
            if (error) {
                logger("error getting repo tags", error);
                clbk(null);
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting repo tags. wrong type", response.headers['content-type'], repo_tags, response);
                clbk(null);
                return;
            }
            
            logger("success getting repo tags", response.request.uri.path, repo_tags);
            
            clbk(repo_tags);
        }
    );
}


function _API_get_repo_tag_img_id(tag_name, clbk) {
    request.get({"url": "https://"+this.endpoint+"/v1/repositories/"+this.repo_name+"/tags/"+tag_name, "json": true, "headers": this.header},
        function name(error, response, img_id) {
            if (error) {
                logger("error getting build tag img id", error);
                clbk(null);
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting build tag img id. wrong type", response.headers['content-type'], img_id, response);
                clbk(null);
                return;
            }
            
            logger("success getting build tag img id", response.request.uri.path, img_id);
            clbk(img_id);
        }
    );
}


/*
 * IMAGE APIS
 */
function _API_get_image_ancestry(img_id, clbk) { 
    request.get({"url": "https://"+this.endpoint+"/v1/images/"+img_id+"/ancestry", "json": true, "headers": this.header},
        function name(error, response, img_ancestry) {
            if (error) {
                logger("error getting build latest ancestry", error, img_ancestry);
                clbk(null);
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting build latest ancestry. wrong type", response.headers['content-type'], img_ancestry, response.request.uri.path);
                clbk(null);
                return;
            }
            
            logger("success getting build latest ancestry", img_ancestry);
            clbk(img_ancestry);
            return;
        }
    );
}

function _API_get_image_json(img_id, clbk) {
    request.get({"url": "https://"+this.endpoint+"/v1/images/"+img_id+"/json", "json": true, "headers": this.header},
        function name(error, response, img_json) {
            if (error) {
                logger("error getting image json", error, img_json);
                clbk(null);
                return;
            }
            
            if (response.headers['content-type'] != "application/json") {
                logger("error getting image json. wrong type", response.headers['content-type'], img_json, response.request.uri.path);
                clbk(null);
                return;
            }
            
            logger("success getting image json", response.request.uri.path, img_json);
            clbk(img_json);
        }
    );
}


/*
 * API DECLARATION
 */

function _API_init(repo_name, clbk) {
    this.repo_name = repo_name;
    this.endpoint  = null;
    this.token     = null;
    this.header    = null;
    this.images    = null;
    this._init_repo_token(clbk);
}


function _API_get_repo_images(clbk) {
    clbk(this.images);
}


var API = _API_init;

API.prototype = {
    get_image_ancestry : _API_get_image_ancestry,
    get_image_json     : _API_get_image_json,
    get_repo_tag_img_id: _API_get_repo_tag_img_id,
    get_repo_tags      : _API_get_repo_tags,
    get_repo_images    : _API_get_repo_images,
    _init_repo_token   : _API_init_repo_token
};


exports.get_repos         = get_repos;
exports.get_repo_info     = get_repo_info;
exports.get_build_history = get_build_history;
exports.get_build_log     = get_build_log;
exports.cacher            = cacher;
exports.webhook_callback  = webhook_callback;
exports.API               = API;
