## 06-11-25
He empezado con la API de scryfall. Voy a crear una cola para no incumplir las 10 peticiones/s. Tambien creare una funcion para validar una decklist, viendo que todas las cartas (Strings) existan. Resulta que hay un endpoint en la API de scryfall al que se le pueden pasar hasta 75 cartas en una peticion. Con dos de esos puedo hacer una validacion de un Deck. A demas de eso he comprobado los comentarios con Insomnia y funcionan bien, aunque quiza deberia hacer que un comentario no pueda tener titulo y parentID a la vez, pero no es un problema a nivel tecnico asi que con no mostrar el titulo en el frontend cuando sea un comentario no deberia dar problema.

## 07-11-25
He caido en la cuenta de dos zonas adicionales que me pueden dar problemas en un deck de magic. Las pegatinas y las atracciones. Teniendo en cuenta que con 2 peticiones de 75 cartas reviso 150 no deberia tener problema en revisar todo el deck con solo 2, pero voy a calcular por si acaso y a mirar si la API de Scryfall tiene alguna clase de plan que permita mas peticiones/s (No para comprarlo, pero de cara a la escalabilidad). Acabo de ver que hay 48 pegatinas, y puedes llevar entre 10 y sin limite. Esto hecha a perder mis calculos, pero no creo que haya problema, pues puedo hacer que el deck se parta en 2 o 3 grupos dependiendo de su longitud (En todos los mazos "realistas" sera 2, y ante un intento de sobrecargar la API solo podran mandar una peticion extra).
Asimismo, voy a apuntar las codiciones para validar un deck en el orden que veo optimo aplicarlas:
### Condiciones para que un deck sea valido.
- Sus comandantes y deck principal suman 100.
- Tiene uno o dos comandantes validos (criaturas legendarias, con Partner si son 2, etc)...


## 18-11-25
Se me ha olvidado que existia este archivo. He hecho avances en varias areas, pero he decidido recortar complejidad del backend y empezar con el frontend ya que nos han cambiado la fecha de entrega del TFG al 12 de febrero y luego al 10 de febrero. Estamos planteando presentar quejas y hacer huelga ya que esta medida esta tomada de cara a los TFG de investigacion, que constan de un PDF de 5000 palabras y una defensa, mientras que los nuestros constan de un PDF de 4000 palabras, la defensa, y el desarrollo completo e individual de una aplicacion fullstack funcional (Con el obvio trabajo de investigacion que eso implica)

He hecho un middleware basico para comprobar un deck usando la API de Scryfall en 2 peticiones, y ahora estoy investigando sobre Tailwindcss y Vue para empezar el frontend. Como cosas que probablemente recorte si la direccion del centro sigue con la cabeza metida en su culo estan:
    - La cola de peticiones que protege de recibir una restriccion temporal de la API de Scryfall
    - El autocompletado en tiempo real con debounce
    - La "Sideboard" o seccion de alternativas de los decks
    - La interfaz de edicion de texto que permite trabajar de manera grafica con formato markdown
    - El uso de una API similar a la de Google Maps en la seccion de torneos
    - La verificacion de correo electronico
A demas de estas tambien se recortara complejidad en aspectos tecnicos como el manejo de errores en el backend para proteger contra request directas a la API. Estos se implementaran de primeras en el frontend ya que existe la maravillosa posibilidad de que el profesor que nos corrige el TFG no sea de nuestra area de especializacion, asi que toca priorizar lo vistoso por encima de lo bien hecho. 

Acabo de hacer que todo lo relativo al JWT token se gestione con una http-only cookie y no con el header "Bearer". A demas, he creado una ruta "/api/session" que llama a un middleware muy similar al de "authMiddleware" con la diferencia de que este esta pensado para dejar pasar la peticion simpre simplemente definiendo el campo req.session, mientras que "authMiddleware" gestiona rutas que requieren un usuario claro y devuelve errores 400 en caso de no poder determinar al usuario de la sesion. Ahora voy a implementarlo en el frontend para que al entrar a la raiz de este te mande siempre a la pagina de home con la diferencia de tener o no la sesion inciada.

## 09-12-2025
Ya he "acabado" gran parte del backend. Me he dado una pequeña pausa por los examenes. Ahora estoy empezando el frontend, he hecho un intento de usar tailwindcss pero por limitaciones de tiempo me ceñire a lo que ya conozco en el apartado de estilos. Tengo una idea inicial de la pagina del login ya hecha y tambien he decidido hacer bastante mala praxis respecto a los issues y drafts de github pues a falta de menos de 3 meses para entregarlo todo gracias a la decision del centro simplemente me sale mas a cuenta hartarme a meter codigo. Tambien dejare bastante de lado estos reportes.

## 10-12-2025
Estoy intentando que la cookie se guarde en firefox entre sesiones. No puedo mas. Es imposible. La cookie se guarda en la sesion correctamente, pero cuando cierro y abro el navegador esta se borra. 
Actualizacion: It was Firefox all along. En mi sqt+sear va perfectamente y seguramente en cualquier otra build que no se dedique a comerse las cookies tambien. Respecto a el resto que la cookie sea de sesion y ya, tampoco puedo hacer milagros.
Lo siguiente que hacer es la pagina de registro y los mensajes segun err code (passwd incorrecta, usuario no encontrado, usuario ya registrado, etc etc etc)