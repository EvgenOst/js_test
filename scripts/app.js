(function(window) {
  var App = {};

  App.main = function() {
    if (localStorage.secondload == "true") {  //Инициализация при повторном запуске
      initialize();
    } else { //Инициализация при первом запуске
      localStorage.secondload = "true";
      $.getJSON("https://www.reddit.com/r/Music.json", function(data, status) {

        if (status == "success") {
          var videos = data.data.children;
          for (var i in videos) {
            var idVideo;
            if (videos[i].data.domain === "youtu.be" || videos[i].data.domain === "youtube.com") {
              var pattern = /([a-zA-Z0-9]|[-_]){11}/;
              idVideo = videos[i].data.url;
              //разбор строки url и взятие id видео
              idVideo = idVideo.match(pattern)[0];
            } else {
              continue;
            }

            var img = videos[i].data.media.oembed.thumbnail_url || "img/no-image.jpg";

            storageSave(
              idVideo,
              videos[i].data.title,
              videos[i].data.created,
              videos[i].data.score,
              img
            );
          }
          initialize();
        }
      });
    }
  };

  //Функция выгрузки видео из localStorage и регистрации обработчиков событий
  function initialize() {
    var lastvideo;

    for (var i = 0; i < localStorage.length; i++) {
      var object = storageLoad(i);

      if (!object) continue;

      lastvideo = createElement(object);
    }

    //регистрация обработчиков событий для добавления видео, поиска и воспроизведения первого видео

    //Очистка local storage
    $("#clean").click(function() {
      localStorage.clear();
      localStorage.secondload = null;
      status("Local storage clear");
      //перезгрузка страницы
      setTimeout(function() {
        location.reload();
      }, 1000);
    });

    //Запуск верхнего видео после запуска прогирывателя
    App.firstVideo = function() {
      lastvideo.click();
    };

    //Работа с модальным окном
    $('#modal_show').click(function(event) {
      event.preventDefault();
      $('#overlay').fadeIn(400, function() {
        $('#modal_form')
          .css('display', 'block')
          .animate({
            opacity: 1,
            top: '50%'
          }, 200);
      });
    });
    /* Зaкрытие мoдaльнoгo oкнa, тут делaем тo же сaмoе нo в oбрaтнoм пoрядке */
    $('#modal_close, #overlay').click(function() { // лoвим клик пo крестику или пoдлoжке
      $('#modal_form')
        .animate({
            opacity: 0,
            top: '45%'
          }, 200, // плaвнo меняем прoзрaчнoсть нa 0 и oднoвременнo двигaем oкнo вверх
          function() { // пoсле aнимaции
            $(this).css('display', 'none'); // делaем ему display: none;
            $('#overlay').fadeOut(400); // скрывaем пoдлoжку
          }
        );
    });

    //Регистрация обработчика на сохранение новой записи
    $("#form_save").click(saveElement);

    //Регистрация обработчика на поиск записей по словам
    $("#search-button").click(search);

  }

  function saveElement(event) {
    event.preventDefault();

    var patId = /^([a-zA-Z0-9]|[-_]){11}$/;
    var patTitle = /[a-zA-Zа-яА-Я0-9]{5,}/;
    var patScore = /^[0-9]+$/;

    var urlEl = $("#form_add_url").val();
    var titleEl = $("#form_add_title").val();
    var scoreEl = $("#form_add_score").val();

    if (!patId.test(urlEl)) {
      statusModal("Недопустимое ID видео")
    } else if (!patTitle.test(titleEl)) {
      statusModal("Мне нужно больше символов!");
    } else if (!patScore.test(scoreEl)) {
      statusModal("Введите число просмотров");
    } else {
      var element = {
        id: urlEl,
        title: titleEl,
        score: scoreEl,
        created: new Date(),
        img: "img/no-image.jpg",
      };

      storageSave(element.id, element.title, element.created, element.score, element.img);
      createElement(element);

      $("#modal_close").click();

      status("Добавлена запись : " + element.id);
    }
  }

  function createElement(object) {
    var elementDescription = $("<div/>", {
        class: "sidebar-description",
      })
      .append($("<div/>", {
        class: "title-sidebar",
        text: object.title,
      }))
      .append($("<div/>", {
        class: "description",
        text: object.score,
      }));

    var img = $("<img/>", {
      class: "sidebar-img",
      src: object.img,
      alt: object.title,
    });


    var element = $("<div/>", {
      class: "sidebar-element",
      click: createCallback(object),
    }).append(img).append(elementDescription);

    $("#sidebar").prepend(element);

    //возврат готового элемента для воспроизведения
    return element;
  }

  function createCallback(object) //Изменение заголовка и описания основного окна и запуск видео
  {
    return function() {
      $("#title").text(object.title);
      $("#created").text(object.created);
      $("#view").text(object.score);
      player.loadVideoById({
        videoId: object.id
      });
      $("body, html").animate({
        scrollTop: 0
      }, 600);
    }
  }

  //Функция поиска по словам
  function search(event) {
    var searchingString = $("#search-input").val();

    if (searchingString == "") {
      $(".sidebar-element").show();
      return;
    }

    $(".sidebar-element").hide();
    $(".title-sidebar").each(function() {
      if (~$(this).text().indexOf(searchingString)) {
        $(this).closest(".sidebar-element").show();
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Сохранение и загрузка в localStorage
  function storageSave(id, title, created_utc, score, img) {
    //объект json, который будет хранится в localstorage в виде строки
    var object = {
      t: title,
      c: created_utc,
      s: score,
      i: img,
    };
    var objectstring = JSON.stringify(object);
    localStorage.setItem(id, objectstring);
  }

  function storageLoad(i) {

    var keyId = localStorage.key(i);

    //Убрать в релизе
    if (keyId == "secondload") {
      status(keyId + " : " + localStorage.getItem(keyId))
      return null;
    }
    /////////////////////////////////

    var value = JSON.parse(localStorage.getItem(keyId));

    if (!value.t || !value.c) {
      console.log("Неизвестная запись " + keyId + " = " + localStorage[keyId]);
      return null;
    }

    var object = {
      id: keyId,
      title: value.t,
      created: value.c,
      score: value.s,
      img: value.i,
    };

    console.log("Id видео : " + object.id);

    return object;
  }
  /////////////////////////////////////////////////////////////////////////////////////

  function status(msg) {
    console.log(msg);
    $("#status").text(msg).slideDown();
    setTimeout(function() {
      $("#status").slideUp();
    }, 5000);
  }

  function statusModal(msg) {
    $("#status_modal").text(msg).slideDown();
  }

  window.App = App;
})(window);
