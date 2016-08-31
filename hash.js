
// If a hash is set, play the level directly
onhashchange = function(){
  if(location.hash){
    level_data = JSON.parse(decodeURIComponent(location.hash.slice(1)));
    screen = 2;
    draw_screen();
  }
}

onhashchange();
