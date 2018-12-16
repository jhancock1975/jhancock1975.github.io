list_files = async (user_id) => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/contents/';
   response = await fetch(url_str);
   myJson = await response.json(); //extract JSON from the http response
  console.log("myJson ", myJson)
}
get_posts = async (user_id, post_element_id) => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/contents/';
   response = await fetch(url_str);
   myJson = await response.json(); //extract JSON from the http response
  console.log("myJson ", myJson)
}
