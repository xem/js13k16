// Ask confirmation if we quit editor (or game) before sharing
onbeforeunload = quit = function(){
  if((screen == 3 || last_screen == 3) && !shared){
    return confirm("Quit? This level will be lost!");
  }
  return true;
}