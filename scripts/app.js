(function(window) {
  'use strict';

  var App = {};
  var $ = window.jQuery;

  var THUMBNAIL_ITEM_SEL = '[data-role="thumbnail item"]';
  var SEARCH_INPUT_SEL = '[data-input-role="search"]';
  var SEARCH_BUTTON_SEL = '[data-button-role="search"]';
  var SEARCH_BY_SEL = '[data-role="search by"]';
  var CLEAN_BUTTON_SEL = '[data-button-role="clean storage"]';
  var VIDEO_TITLE_SEL = '[data-video-role="title"]';
  var VIDEO_DATE_SEL = '[data-video-role="date"]';
  var VIDEO_VIEWS_SEL = '[data-video-role="views"]';
  var VIDEOS_LIST_SEL = '[data-role="videos list"]';
  var SHOW_MODAL_BUTTON_SEL = '[data-button-role="show modal"]';
  var CLOSE_MODAL_BUTTON_SEL = '[data-button-role="close modal"]';
  var MODAL_SEL = '[data-role="modal"]';
  var MODAL_STATUS_SEL = '[data-role="modal status line"]';
  var INPUT_URL_SEL = '[data-input-role="url"]';
  var INPUT_TITLE_SEL = '[data-input-role="title"]';
  var INPUT_VIEWS_SEL = '[data-input-role="views"]';
  var OVERLAY_SEL = '[data-role="overlay"]';
  var SAVE_BUTTON_SEL = '[data-button-role="save video"]';

  App.main = function() {
    if (localStorage.secondload == "true") { //Инициализация при повторном запуске
      initialize();
    } else { //Инициализация при первом запуске
      localStorage.secondload = "true";
      $.getJSON("https://www.reddit.com/r/Music.json", function(data, status) {

        if (status == "success") {
          var videos = data.data.children;
          var pattern = /([a-zA-Z0-9]|[-_]){11}/;
          for (var i in videos) {
            if (videos[i].data.domain === "youtu.be" || videos[i].data.domain === "youtube.com") {
              var idVideo = videos[i].data.url;
              if (!pattern.test(idVideo)) continue;
              //разбор строки url и взятие id видео
              idVideo = idVideo.match(pattern)[0];
            } else {
              continue;
            }

            var img = (
              videos[i].data.media &&
              videos[i].data.media.oembed &&
              videos[i].data.media.oembed.thumbnail_url
            ) || "img/no-image.jpg";

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
    $(CLEAN_BUTTON_SEL).click(function(event) {
      localStorage.clear();
      localStorage.secondload = undefined;
      status("Local storage clear");
      setTimeout(function() { //перезгрузка страницы
        location.reload();
      }, 1000);
    });

    //Работа с модальным окном
    $(SHOW_MODAL_BUTTON_SEL).click(function(event) {
      event.preventDefault();
      $(OVERLAY_SEL).fadeIn(400, function() {
        $(MODAL_SEL)
          .css('display', 'block')
          .animate({
            opacity: 1,
            top: '50%'
          }, 200);
      });
    });
    // Зaкрытие мoдaльнoгo oкнa
    $(CLOSE_MODAL_BUTTON_SEL).click(function() {
      $(MODAL_SEL)
        .animate({
            opacity: 0,
            top: '45%'
          },
          200,
          function() { // пoсле aнимaции
            $(this).css('display', 'none');
            $(OVERLAY_SEL).fadeOut(400); // скрывaем пoдлoжку
          }
        );
    });

    //Регистрация обработчика на сохранение новой записи
    $(SAVE_BUTTON_SEL).click(saveElementHandler);

    //Регистрация обработчика на поиск записей по словам
    $(SEARCH_BUTTON_SEL).click(searchHandler);
    $(SEARCH_BUTTON_SEL).keydown(function(event) {
      if (event.keyCode === 13) {
        searchHandler(event);
      }
    })

    //Запуск верхнего видео после запуска прогирывателя
    lastvideo.click();
  }

  function saveElementHandler(event) {
    event.preventDefault();

    var patId = /^([a-zA-Z0-9]|[-_]){11}$/;
    var patTitle = /[a-zA-Zа-яА-Я0-9]{5,}/;
    var patViews = /^[0-9]+$/;

    var $url = $(INPUT_URL_SEL);
    var $title = $(INPUT_TITLE_SEL);
    var $views = $(INPUT_VIEWS_SEL);

    if (!patId.test($url.val())) {
      statusModal("Недопустимое ID видео");
      return;
    } else if (!patTitle.test($title.val())) {
      statusModal("Мне нужно больше символов!");
      return;
    } else if (!patViews.test($views.val())) {
      statusModal("Введите число просмотров");
      return;
    } else {
      var element = {
        id: $url.val(),
        title: $title.val(),
        views: $views.val(),
        date: (new Date()).getTime(),
        img: "img/no-image.jpg",
      };

      storageSave(element.id, element.title, element.date, element.views, element.img);
      createElement(element);

      $url.val("");
      $title.val("");
      $views.val("");
      $(CLOSE_MODAL_BUTTON_SEL).click();

      status("Добавлена запись : " + element.id);
    }
  }

  function createElement(object) {
    var elementDescription = $("<div/>", {
        class: "thumbnail-description",
      })
      .append($("<div/>", {
        class: "thumbnail-title",
        'data-role': 'search by',
        text: object.title,
      }))
      .append($("<div/>", {
        class: "thumbnail-views",
        text: 'Просмотров: ' + object.views,
      }));

    var img = $("<img/>", {
      class: "thumbnail-image",
      src: object.img,
      alt: object.title,
    });


    var element = $("<li>", {
      class: "thumbnail-item",
      'data-role': 'thumbnail item',
      click: createCallback(object),
    }).append(img).append(elementDescription);

    $(VIDEOS_LIST_SEL).prepend(element);

    //возврат готового элемента для воспроизведения
    return element;
  }

  function createCallback(object) //Изменение заголовка и описания основного окна и запуск видео
  {
    return function() {
      $(VIDEO_TITLE_SEL).text(object.title);
      $(VIDEO_DATE_SEL).text((new Date(object.date)).toLocaleString());
      $(VIDEO_VIEWS_SEL).text('Просмотров: ' + object.views);
      player.loadVideoById({
        videoId: object.id
      });
      $("body, html").animate({
        scrollTop: 0
      }, 600);
    }
  }

  //Функция поиска по словам
  function searchHandler(event) {
    event.preventDefault();
    var $searchInput = $(SEARCH_INPUT_SEL);
    var searchingString = $searchInput.val().toLowerCase();

    if (searchingString == "") {
      $(THUMBNAIL_ITEM_SEL).show();
      return;
    }

    $(SEARCH_BY_SEL).each(function() {
      if ($(this).text().toLowerCase().indexOf(searchingString) == -1) {
        $(this).closest(THUMBNAIL_ITEM_SEL).slideUp();
      } else {
        $(this).closest(THUMBNAIL_ITEM_SEL).show();
      }
    });
    $searchInput.val("");
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Сохранение и загрузка в localStorage
  function storageSave(id, title, date, views, img) {
    //объект json, который будет хранится в localstorage в виде строки
    var object = {
      t: title,
      d: date,
      v: views,
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

    if (!value.t || !value.d) {
      console.log("Неизвестная запись " + keyId + " = " + localStorage[keyId]);
      return null;
    }

    var object = {
      id: keyId,
      title: value.t,
      date: value.d,
      views: value.v,
      img: value.i,
    };

    console.log("Id видео : " + object.id);

    return object;
  }
  /////////////////////////////////////////////////////////////////////////////////////

  function status(msg) {
    console.log(msg);
  }

  function statusModal(msg) {
    $(MODAL_STATUS_SEL).text(msg).slideDown();
    setTimeout(function () {
      $(MODAL_STATUS_SEL).slideUp();
    }, 5000);
  }

  window.App = App;
})(window);
