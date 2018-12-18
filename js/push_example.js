/**
 * The error structure returned when a network call fails
 */
class ResponseError extends Error {
   /**
    * Construct a new ResponseError
    * @param {string} message - an message to return instead of the the default
    * error message
    * @param {string} path - the requested path
    * @param {Object} response - the object returned by Axios
    */
   constructor(message, path, response) {
      super(message);
      this.path = path;
      this.request = response.config;
      this.response = (response || {}).response || response;
      this.status = response.status;
   }
}

/**
 * Requestable wraps the logic for making http requests to the API
 */
class Requestable {
   /**
    * Either a username and password or an oauth token for Github
    * @typedef {Object} Requestable.auth
    * @prop {string} [username] - the Github username
    * @prop {string} [password] - the user's password
    * @prop {token} [token] - an OAuth token
    */
   /**
    * Initialize the http internals.
    * @param {Requestable.auth} [auth] - the credentials to authenticate to
    * Github. If auth is
    *                                  not provided request will be made
    *                                  unauthenticated
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    * @param {string} [AcceptHeader=v3] - the accept header for the requests
    */
   constructor(auth, apiBase, AcceptHeader) {
      this.__apiBase = apiBase || 'https://api.github.com';
      this.__auth = {
         token: auth.token,
         username: auth.username,
         password: auth.password,
      };
      this.__AcceptHeader = AcceptHeader || 'v3';

      if (auth.token) {
         this.__authorizationHeader = 'token ' + auth.token;
      } else if (auth.username && auth.password) {
         this.__authorizationHeader = 'Basic ' + Base64.encode(auth.username +
':' + auth.password);
      }
   }

   /**
    * Compute the URL to use to make a request.
    * @private
    * @param {string} path - either a URL relative to the API base or an
    * absolute URL
    * @return {string} - the URL to use
    */
   __getURL(path) {
      let url = path;

      if (path.indexOf('//') === -1) {
         url = this.__apiBase + path;
      }

      let newCacheBuster = 'timestamp=' + new Date().getTime();
      return url.replace(/(timestamp=\d+)/, newCacheBuster);
   }

   /**
    * Compute the headers required for an API request.
    * @private
    * @param {boolean} raw - if the request should be treated as JSON or as a
    * raw request
    * @param {string} AcceptHeader - the accept header for the request
    * @return {Object} - the headers to use in the request
    */
   __getRequestHeaders(raw, AcceptHeader) {
      let headers = {
         'Content-Type': 'application/json;charset=UTF-8',
         'Accept': 'application/vnd.github.' + (AcceptHeader ||
this.__AcceptHeader),
      };

      if (raw) {
         headers.Accept += '.raw';
      }
      headers.Accept += '+json';

      if (this.__authorizationHeader) {
         headers.Authorization = this.__authorizationHeader;
      }

      return headers;
   }

   /**
    * Sets the default options for API requests
    * @protected
    * @param {Object} [requestOptions={}] - the current options for the request
    * @return {Object} - the options to pass to the request
    */
   _getOptionsWithDefaults(requestOptions = {}) {
      if (!(requestOptions.visibility || requestOptions.affiliation)) {
         requestOptions.type = requestOptions.type || 'all';
      }
      requestOptions.sort = requestOptions.sort || 'updated';
      requestOptions.per_page = requestOptions.per_page || '100'; //
eslint-disable-line

      return requestOptions;
   }

   /**
    * if a `Date` is passed to this function it will be converted to an ISO
    * string
    * @param {*} date - the object to attempt to cooerce into an ISO date string
    * @return {string} - the ISO representation of `date` or whatever was passed
    * in if it was not a date
    */
   _dateToISO(date) {
      if (date && (date instanceof Date)) {
         date = date.toISOString();
      }

      return date;
   }

   /**
    * A function that receives the result of the API request.
    * @callback Requestable.callback
    * @param {Requestable.Error} error - the error returned by the API or `null`
    * @param {(Object|true)} result - the data returned by the API or `true` if
    * the API returns `204 No Content`
    * @param {Object} request - the raw {@linkcode
    * https://github.com/mzabriskie/axios#response-schema Response}
    */
   /**
    * Make a request.
    * @param {string} method - the method for the request (GET, PUT, POST,
    * DELETE)
    * @param {string} path - the path for the request
    * @param {*} [data] - the data to send to the server. For HTTP methods that
    * don't have a body the data
    *                   will be sent as query parameters
    * @param {Requestable.callback} [cb] - the callback for the request
    * @param {boolean} [raw=false] - if the request should be sent as raw. If
    * this is a falsy value then the
    *                              request will be made as JSON
    * @return {Promise} - the Promise for the http request
    */
   _request(method, path, data, cb, raw) {
      const url = this.__getURL(path);

      const AcceptHeader = (data || {}).AcceptHeader;
      if (AcceptHeader) {
         delete data.AcceptHeader;
      }
      const headers = this.__getRequestHeaders(raw, AcceptHeader);

      let queryParams = {};

      const shouldUseDataAsParams = data && (typeof data === 'object') &&
methodHasNoBody(method);
      if (shouldUseDataAsParams) {
         queryParams = data;
         data = undefined;
      }

      const config = {
         url: url,
         method: method,
         headers: headers,
         params: queryParams,
         data: data,
         responseType: raw ? 'text' : 'json',
      };

      console.debug(`${config.method} to ${config.url}`);
      const requestPromise = axios(config).catch(callbackErrorOrThrow(cb,
path));

      if (cb) {
         requestPromise.then((response) => {
            if (response.data && Object.keys(response.data).length > 0) {
               // When data has results
               cb(null, response.data, response);
            } else if (config.method !== 'GET' &&
Object.keys(response.data).length < 1) {
               // True when successful submit a request and receive a empty
               // object
               cb(null, (response.status < 300), response);
            } else {
               cb(null, response.data, response);
            }
         });
      }

      return requestPromise;
   }

   /**
    * Make a request to an endpoint the returns 204 when true and 404 when false
    * @param {string} path - the path to request
    * @param {Object} data - any query parameters for the request
    * @param {Requestable.callback} cb - the callback that will receive `true`
    * or `false`
    * @param {method} [method=GET] - HTTP Method to use
    * @return {Promise} - the promise for the http request
    */
   _request204or404(path, data, cb, method = 'GET') {
      return this._request(method, path, data)
         .then(function success(response) {
            if (cb) {
               cb(null, true, response);
            }
            return true;
         }, function failure(response) {
            if (response.response.status === 404) {
               if (cb) {
                  cb(null, false, response);
               }
               return false;
            }

            if (cb) {
               cb(response);
            }
            throw response;
         });
   }

   /**
    * Make a request and fetch all the available data. Github will paginate
    * responses so for queries
    * that might span multiple pages this method is preferred to {@link
    * Requestable#request}
    * @param {string} path - the path to request
    * @param {Object} options - the query parameters to include
    * @param {Requestable.callback} [cb] - the function to receive the data. The
    * returned data will always be an array.
    * @param {Object[]} results - the partial results. This argument is intended
    * for interal use only.
    * @return {Promise} - a promise which will resolve when all pages have been
    * fetched
    * @deprecated This will be folded into {@link Requestable#_request} in the
    * 2.0 release.
    */
   _requestAllPages(path, options, cb, results) {
      results = results || [];

      return this._request('GET', path, options)
         .then((response) => {
            let thisGroup;
            if (response.data instanceof Array) {
               thisGroup = response.data;
            } else if (response.data.items instanceof Array) {
               thisGroup = response.data.items;
            } else {
               let message = `cannot figure out how to append ${response.data}
to the result set`;
               throw new ResponseError(message, path, response);
            }
            results.push(...thisGroup);

            const nextUrl = getNextPage(response.headers.link);
            if (nextUrl && !(options && typeof options.page !== 'number')) {
               console.debug(`getting next page: ${nextUrl}`);
               return this._requestAllPages(nextUrl, options, cb, results);
            }

            if (cb) {
               cb(null, results, response);
            }

            response.data = results;
            return response;
         }).catch(callbackErrorOrThrow(cb, path));
   }
}


// ////////////////////////// //
//  Private helper functions  //
// ////////////////////////// //
const METHODS_WITH_NO_BODY = ['GET', 'HEAD', 'DELETE'];
function methodHasNoBody(method) {
   return METHODS_WITH_NO_BODY.indexOf(method) !== -1;
}

function getNextPage(linksHeader = '') {
   const links = linksHeader.split(/\s*,\s*/); // splits and strips the urls
   return links.reduce(function(nextUrl, link) {
      if (link.search(/rel="next"/) !== -1) {
         return (link.match(/<(.*)>/) || [])[1];
      }

      return nextUrl;
   }, undefined);
}

function callbackErrorOrThrow(cb, path) {
   return function handler(object) {
      let error;
      if (object.hasOwnProperty('config')) {
         const {response: {status, statusText}, config: {method, url}} = object;
         let message = (`${status} error making request ${method} ${url}:
"${statusText}"`);
         error = new ResponseError(message, path, object);
         console.debug(`${message} ${JSON.stringify(object.data)}`);
      } else {
         error = object;
      }
      if (cb) {
         console.debug('going to error callback');
         cb(error);
      } else {
         console.debug('throwing error');
         throw error;
      }
   };
}


class Repository extends Requestable{
  /**
    * Create a Repository.
    * @param {string} fullname - the full name of the repository
    * @param {Requestable.auth} [auth] - information required to authenticate to
    * Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(fullname, auth, apiBase) {
      super(auth, apiBase);
      this.__fullname = fullname;
      this.__currentTree = {
         branch: null,
         sha: null,
      };
   }

  /**
    * List all the branches for the repository
    * @see https://developer.github.com/v3/repos/#list-branches
    * @param {Requestable.callback} cb - will receive the list of branches
    * @return {Promise} - the promise for the http request
    */
  listBranches(cb) {
      return this._request('GET', `/repos/${this.__fullname}/branches`, null,
        cb);
   }

   /**
    * Create a new branch from an existing branch.
    * @param {string} [oldBranch=master] - the name of the existing branch
    * @param {string} newBranch - the name of the new branch
    * @param {Requestable.callback} cb - will receive the commit data for the
    * head of the new branch
    * @return {Promise} - the promise for the http request
    */
   createBranch(oldBranch, newBranch, cb) {
      if (typeof newBranch === 'function') {
         cb = newBranch;
         newBranch = oldBranch;
         oldBranch = 'master';
      } 

       return this.getRef(`heads/${oldBranch}`)
         .then((response) => {
            let sha = response.data.object.sha;
            return this.createRef({
               sha,
               ref: `refs/heads/${newBranch}`,
            }, cb);
         });
   }

   /**
    * Get a reference
    * @see https://developer.github.com/v3/git/refs/#get-a-reference
    * @param {string} ref - the reference to get
    * @param {Requestable.callback} [cb] - will receive the reference's refSpec
    * or a list of refSpecs that match `ref`
    * @return {Promise} - the promise for the http request
    */
   getRef(ref, cb) {
      return this._request('GET', `/repos/${this.__fullname}/git/refs/${ref}`,
         null, cb);
   }

   /**
    * Get a commit from the repository
    * @see https://developer.github.com/v3/repos/commits/#get-a-single-commit
    * @param {string} sha - the sha for the commit to fetch
    * @param {Requestable.callback} cb - will receive the commit data
    * @return {Promise} - the promise for the http request
    */
   getCommit(sha, cb) {
      return this._request('GET',
        `/repos/${this.__fullname}/git/commits/${sha}`, null, cb);
   }

   /**
    * Create a blob
    * @see https://developer.github.com/v3/git/blobs/#create-a-blob
    * @param {(string|Buffer|Blob)} content - the content to add to the
    * repository
    * @param {Requestable.callback} cb - will receive the details of the created
    * blob
    * @return {Promise} - the promise for the http request
    */
   createBlob(content, cb) {
      let postBody = this._getContentObject(content);

      console.debug('sending content', postBody);
      return this._request('POST', `/repos/${this.__fullname}/git/blobs`,
        postBody, cb);
   }

  /**
    * Create a new tree in git
    * @see https://developer.github.com/v3/git/trees/#create-a-tree
    * @param {Object} tree - the tree to create
    * @param {string} baseSHA - the root sha of the tree
    * @param {Requestable.callback} cb - will receive the new tree that is
    * created
    * @return {Promise} - the promise for the http request
    */
   createTree(tree, baseSHA, cb) {
      return this._request('POST', `/repos/${this.__fullname}/git/trees`, {
         tree,
         base_tree: baseSHA, // eslint-disable-line camelcase
      }, cb);
   }

  /**
    * Add a commit to the repository
    * @see https://developer.github.com/v3/git/commits/#create-a-commit
    * @param {string} parent - the SHA of the parent commit
    * @param {string} tree - the SHA of the tree for this commit
    * @param {string} message - the commit message
    * @param {Requestable.callback} cb - will receive the commit that is created
    * @return {Promise} - the promise for the http request
    */
   commit(parent, tree, message, cb) {
      let data = {
         message,
         tree,
         parents: [parent],
      };

      return this._request('POST', `/repos/${this.__fullname}/git/commits`,
        data, cb)
         .then((response) => {
            this.__currentTree.sha = response.data.sha; // Update latest commit
            return response;
         });
   }
 
   /**
    * Update a ref
    * @see https://developer.github.com/v3/git/refs/#update-a-reference
    * @param {string} ref - the ref to update
    * @param {string} commitSHA - the SHA to point the reference to
    * @param {boolean} force - indicates whether to force or ensure a
    * fast-forward update
    * @param {Requestable.callback} cb - will receive the updated ref back
    * @return {Promise} - the promise for the http request
    */
   updateHead(ref, commitSHA, force, cb) {
      return this._request('PATCH', `/repos/${this.__fullname}/git/refs/${ref}`,
      {
         sha: commitSHA,
         force: force,
      }, cb);
   } 
}

/**
 * @file
 * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
 * @license    Licensed under {@link
 * https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */
/* eslint valid-jsdoc: ["error", {"requireReturnDescription": false}] */

/**
 * GitHub encapsulates the functionality to create various API wrapper objects.
 */
class GitHub {
   /**
    * Create a new GitHub.
    * @param {Requestable.auth} [auth] - the credentials to authenticate to
    * Github. If auth is
    *                                  not provided requests will be made
    *                                  unauthenticated
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(auth, apiBase = 'https://api.github.com') {
      this.__apiBase = apiBase;
      this.__auth = auth || {};
   }

   /**
    * Create a new Repository wrapper
    * @param {string} user - the user who owns the repository
    * @param {string} repo - the name of the repository
    * @return {Repository}
    */
   getRepo(user, repo) {
      return new Repository(this._getFullName(user, repo), this.__auth,
this.__apiBase);
   }

   /**
    * Computes the full repository name
    * @param {string} user - the username (or the full name)
    * @param {string} repo - the repository name, must not be passed if `user`
    * is the full name
    * @return {string} the repository's full name
    */
   _getFullName(user, repo) {
      let fullname = user;

      if (repo) {
         fullname = `${user}/${repo}`;
      }

      return fullname;
   }
}

module.exports = GitHub;

/**
 * this code copied from:
 * https://medium.freecodecamp.org/pushing-a-list-of-files-to-the-github-with-javascript-b724c8c09b66
 * accessed December 18, 2018.
 * probably would have been better to use the gist linked to in the tutorial:
 * https://gist.github.com/iktash/31ccc1d8582bd9dcb15ee468c7326f2d
 */

function GithubAPI(auth) {
    let repo;
    let filesToCommit = [];
    let currentBranch = {};
    let newCommit = {};
    this.gh = new GitHub(auth);
   

    /**
     * Sets the current repository to make push to
     * @public
     * @param {string} userName Name of the user who owns the repository
     * @param {string} repoName Name of the repository
     * @return void
     */ 
    this.setRepo = function(userName, repoName) {
      repo = this.gh.getRepo(userName, repoName);
    }

    /**
     * Sets the current branch to make push to. If the branch doesn't exist yet,
     * it will be created first
     * @public
     * @param {string} branchName The name of the branch
     * @return {Promise}
     */
    this.setBranch = function(branchName) {
      return repo.listBranches()
        .then((branches) => {
            let branchExists = branches.data
                .find( branch => branch.name === branchName );
            if (!branchExists) {
                return repo.createBranch('master', branchName)
                    .then(() => {
                        currentBranch.name = branchName;
                    });
            } else {
                currentBranch.name = branchName;
            }
        });
    }

    /**
     * Makes the push to the currently set branch
     * @public
     * @param  {string}   message Message of the commit
     * @param  {object[]} files   Array of objects (with keys 'content' and
     * 'path'),
     *                            containing data to push
     * @return {Promise}
     */
    this.pushFiles = function(message, files) {
      return getCurrentCommitSHA()
        .then(getCurrentTreeSHA)
        .then( () => createFiles(files) )
        .then(createTree)
        .then( () => createCommit(message) )
        .then(updateHead)
        .catch((e) => {
            console.error(e);
        });
     }

    /**
     * Sets the current commit's SHA
     * @private
     * @return {Promise}
     */
    function getCurrentCommitSHA() {
      return repo.getRef('heads/' + currentBranch.name)
        .then((ref) => {
            currentBranch.commitSHA = ref.data.object.sha;
        });
    }



    /**
     * Sets the current commit tree's SHA
     * @private
     * @return {Promise}
     */
    function getCurrentTreeSHA() {
      return repo.getCommit(currentBranch.commitSHA)
        .then((commit) => {
            currentBranch.treeSHA = commit.data.tree.sha;
        });
    }

    /**
     * Creates blobs for all passed files
     * @private
     * @param  {object[]} filesInfo Array of objects (with keys 'content' and
     * 'path'),
     *                              containing data to push
     * @return {Promise}
     */
    function createFiles(files) {
      let promises = [];
      let length = filesInfo.length;
      for (let i = 0; i < length; i++) {
          promises.push(createFile(files[i]));
       }
      return Promise.all(promises);
    }

    /**
     * Creates a blob for a single file
     * @private
     * @param  {object} fileInfo Array of objects (with keys 'content' and
     * 'path'),
     *                           containing data to push
     * @return {Promise}
     */
    function createFile(file) {
      return repo.createBlob(file.content)
        .then((blob) => {
            filesToCommit.push({
                sha: blob.data.sha,
                path: fileInfo.path,
                mode: '100644',
                type: 'blob'
            });
        });
     }

    /**
     * Creates a new tree
     * @private
     * @return {Promise}
     */
    function createTree() {
     return repo.createTree(filesToCommit, currentBranch.treeSHA)
        .then((tree) => {
            newCommit.treeSHA = tree.data.sha;
        });
    }

    /**
     * Creates a new commit
     * @private
     * @param  {string} message A message for the commit
     * @return {Promise}
     */
    function createCommit(message) {
      return repo.commit(currentBranch.commitSHA, newCommit.treeSHA, message)
        .then((commit) => {
            newCommit.sha = commit.data.sha;
        });
    }

    /**
     * Updates the pointer of the current branch to point the newly created
     * commit
     * @private
     * @return {Promise}
     */
    function updateHead() {
      return repo.updateHead(
        'heads/' + currentBranch.name,
        newCommit.sha);
    }
};

if ((token_val === '') || (token_val === undefined)){
  throw 'Please set a value for the token';
}
else {
  let api = new GithubAPI({token: token_val});
  api.setRepo(site_settings[user_id], site_settings[repo_name]);
  api.setBranch(site_settings[branch_name])
      .then( () => api.pushFiles(
          'Making a commit with my adorable files',
          [
              {content: 'You are a Wizard, Harry', path: 'harry.txt'},
              {content: 'May the Force be with you', path: 'jedi.txt'}
          ])
      )
      .then(function() {
          console.log('Files committed!');
      });
}
