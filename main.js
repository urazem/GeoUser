(function(){

    'use strict;'
    
    let M = {
            'Init' : {    // developer.here.com for app_id and app_code
              'app_id':   '62e3HsKGtpj3laFcuZq0',
              'app_code': 'GHXWuncLIc73oOHM92ypYw',
              useHTTPS: true
            },
            'Behavior' :    {},       // Управление событиями карты
            'Container' :   {},       // Контейнер для отображения карты
            'PlacesService':{},       // Сервис Places API
            'PlacesGroup':  {},       // Группа для хранения маркеров
            'Lat' :         55.751,   // Широта (центр карты)
            'Lng' :         37.620,   // Долгота (центр карты)
            'Layers' :      {},       // Список картографических основ
            'Map' :         {},       // Объект карты
            'Platform' :    {},       // Платформа HERE API
            'UI' :          {},       // Пользовательский интерфейс
            'Zoom' :        12        // 1 = весь мир,15 = масштаб улицы
         };
 
 
         // Контейнер для отображения карты 
         M.Container = document.querySelector('#map')
           
         // Инициализация платформы
         M.Platform = new H.service.Platform(M.Init)
           
         // Получение доступа к сервису Places API
         M.PlacesService = M.Platform.getPlacesService()
 
         // Создание группы для хранения результатов запроса Places API
         M.PlacesGroup = new H.map.Group()
           
         // Список картографических основ
         M.Layers = M.Platform.createDefaultLayers({lg:'rus'})
 
         // Создание объекта карты 
         M.Map = new H.Map(M.Container, M.Layers.normal.map)
           
         // Добавление интерактивности
         M.Behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(M.Map))
           
         // Пользовательский интерфейс
         M.UI = H.ui.UI.createDefault(M.Map, M.Layers)
 
 
 
         // Обработчик изменения размеров окна браузера
         window.addEventListener('resize', () => {
           M.Map.getViewPort().resize()
         })
 
         // Функция для отображения карты
         function displayMap () {
             
             // Центр карты
             M.Map.setCenter({lat: M.Lat, lng: M.Lng})
             
             // Масштаб 2 - весь мир, 17 - уровень улицы
             M.Map.setZoom(M.Zoom)
 
             // Группа для хранения маркеров
             M.Map.addObject(M.PlacesGroup)
         }
 
         // Вызов функции для инициализации карты
         displayMap()
    let C = {
        // Перевод шагов в метры
        CvtStepsToMeters: steps => steps * 0.762,
        // Перевод метров в шаги
        CvtMetersToSteps: meters => meters / 0.762,
        // Функция для создания маркеров
        CreateMarker: (coords, options=null) => new H.map.Marker({ lat: coords.lat, lng: coords.lng }, options),
    }

    let P = {
        'Latitude': 11.751,
        'Longitude': 37.620,
        'Category': 'sights-museums',       // Категория поиска
        'Radius': C.CvtStepsToMeters(2500), // Радиус поиска в метрах
        'ShowPlaces': {}      // Функция для выполнения поискового запроса
    }
    P.ShowPlaces = () => {
        
        /* 
        Объект содержащий параметры запроса. Подробнее можно ознакомиться 
        на портале для разработчиков - https://developer.here.com в разделе Places API
        */
        let explore = {
            'in': `${P.Latitude},${P.Longitude};r=${P.Radius}`,
            'cat': P.Category
        }

        // Асинхронный запрос к сервису Places API
        M.PlacesService.explore(
            explore,                    // параметры запроса
            result => onResult(result), // обработчик успешного ответа сервера
            error => onError(error)     // обработчик ошибки
        )

        let onResult = async result => {
            // Выводим в консоль результат запроса
            console.log(result)
        
            // Маркер с координатами местоположения пользователя
            let startPoint = C.CreateMarker({ lat: P.Latitude, lng: P.Longitude }, {})
            
            // Очищаем группу с маркерами
            M.PlacesGroup.removeObjects(M.PlacesGroup.getObjects())
            
                // Обработка массива объектов
                result.results.items.forEach( point => {
                    
                    // Создание маркета для текущего объекта
                    let endPoint = C.CreateMarker({ lat: point.position[0], lng: point.position[1]}, {icon: new H.map.Icon(point.icon)})
                    
                    // Вычисление расстояния в метрах от местоположения пользователя до объекта поиска
                    let distance = startPoint.getPosition().distance(endPoint.getPosition())
                    
                    /* 
                    Сохранение информации о названии текущего объекта
                    и количестве шагов до него.
                    Добавление вывода информации по клику.
                    */
                    endPoint.setData({ 'distance': C.CvtMetersToSteps(distance), 'name': point.title}).addEventListener('tap', e => {
                        alert("Название: " + e.target.getData().name + "\n" +"Количество шагов: " + e.target.getData().distance.toFixed(0))
                    })

                    // Добавление объекта в группу
                    M.PlacesGroup.addObject(endPoint)
                
                    // Масштабирование карты по выборке
                    M.Map.setViewBounds(M.PlacesGroup.getBounds())
                })
                
            }
        
            // При возникновении ошибки информация будет отображена в консоли
            let onError = error => console.log(error)

        }
        let G = {
            'StartTrackPosition': {},  // Функция отслеживания местоположения
            'ShowPosition': {},        // Функция отображения местоположения пользователя на карте
            'ShowError': {},           // Обработчик ошибки - например пользователь не дал доступ к трекингу геолокации 
            'CurrentPosition': {},     // Координаты текущего местоположения
            'LocationMarker':{},       // Маркер с текущим местоположением
        }

        G.StartTrackPosition = () => {
            // Проверка поддержки браузером Geolocation API
            if (navigator.geolocation) {
                // Начать трекинг местоположения
                navigator.geolocation.watchPosition(G.ShowPosition, G.ShowError)
            } else {
                // Вывод в консоль сообщения об ошибке
                console.log("Geolocation is not supported by this browser.")
            }
        }

        G.ShowPosition = position => {
            // Сохранение координат текущего местоположения
            G.CurrentPosition = { 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
            }
            
            // Обновление центра карты
            M.Map.setCenter(G.CurrentPosition)
            
            // Если объект маркера уже существует, обновляем значение координат на текущее
            if (G.LocationMarker instanceof H.map.Marker) {
                G.LocationMarker.setPosition(G.CurrentPosition)
            } else {
                G.LocationMarker = C.CreateMarker(G.CurrentPosition, {})
                M.Map.addObject(G.LocationMarker)
            }       
        }

        // Обработка ошибок
        G.ShowError = error =>{
            switch(error.code) {
                case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.")
                break
                case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.")
                break
                case error.TIMEOUT:
                alert("The request to get user location timed out.")
                break
                case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.")
                break
            }
        }

        // Запуск трекинга местоположения
        G.StartTrackPosition()
        document.querySelector('#search').addEventListener('click', e => {

            if(document.querySelector("#steps").value != ''){
                try{
                    // Меняем параметры поиска
                    P.Radius = C.CvtStepsToMeters(Number(document.querySelector("#steps").value))
                    P.Latitude  = G.CurrentPosition.lat
                    P.Longitude = G.CurrentPosition.lng
                    
                    // Вызов функции поиска
                    P.ShowPlaces()
                }catch(err){
                    console.log(err)
                }
            }  
            })
        }())