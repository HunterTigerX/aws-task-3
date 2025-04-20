Локальное приложение можно запустив введя команду `npm run start` находять в папке `backend\bff-service`, или находясь в корне проекта, указав путь в консоли при помощи `cd .\backend\bff-service\`.

AUTH
POST http://localhost:3000/authorization?register регистрирует пользователя
```
{
  "username": "huntertigerx3",
  "password": "TEST_PASSWORD"
}
```
POST http://localhost:3000/authorization?login возвращает Bearer Token
```
{
  "username": "huntertigerx3",
  "password": "TEST_PASSWORD"
}
```
PRODUCT
Для всех запросов надо иметь Basic авторизацию.
GET http://localhost:3000/products возвращает все продукты
GET http://localhost:3000/product возвращает все продукты
GET http://localhost:3000/product?available возвращает все продукты
GET http://localhost:3000/products?4b4a7ccb-f566-4527-a129-d9a948cf0aca возвращает продукт по ID
GET http://localhost:3000/product?4b4a7ccb-f566-4527-a129-d9a948cf0aca возвращает продукт по ID

PUT http://localhost:3000/product позволяет изменять данные товара, если указан правильный ID продукта. На сайте при изменении данных продукта позволяет изменять только поля  `Title`, `Description`, `Price`, `Count`, но используя JSON, можно использовать как
```
{
    "count": 90,
    "imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true",
    "price": 799.99,
    "description": "Flagship DS Android phone with Snapdragon 8 Gen 145",
    "title": "Samsung Galaxy ABS23",
    "id": "4b4a7ccb-f566-4527-a129-d9a948cf0aca"
}
```
Так и 
```
{
    "count": 90,
    "price": 799.99,
    "description": "Flagship Android phone with Snapdragon 8 Gen 22",
    "title": "Samsung Galaxy S23",
    "id": "4b4a7ccb-f566-4527-a129-d9a948cf0aca"
}
```
На сайте по адресу `https://d138sljllinulj.cloudfront.net/admin/product-form` при помощи PUT запроса на BFF можно добавить новый продукт.

DELETE http://localhost:3000/product?{id}, к примеру, http://localhost:3000/product?4b4a7ccb-f566-4527-a129-d9a948cf0aca удаляет продукт из базы данных. Можно узнать товары используя GET запрос http://localhost:3000/products, там взять ID продукта, затем удалить по id товар. 
На сайте удаления товаров работает на странице `https://d138sljllinulj.cloudfront.net/admin/orders`.

CART
GET http://localhost:3000/cart возвращает товары в корзине
PUT http://localhost:3000/cart добавляет товары в корзину
При добавлении товара в корзину, следует помнить, что должна быть авторизация. id может в примере быть не валидным, если вдруг я сгенерирую по новой базу данных, следовательно лучше всего сначала запустить `http://localhost:3000/product`, там взять id продукта, затем его использовать при запросе в `http://localhost:3000/cart`
```
{
    "product": {
      "id": "732891c7-c352-40a4-8c93-6f9bcaaad277"
    },
    "count": 1
}
```
GET http://localhost:3000/cart?order возвращает список заказов.
PUT http://localhost:3000/cart?order отправляет заказ
```
{
   "items": [
       {
           "productId": "1ea0ef3e-23f1-438a-97ca-fe3dd4caf68f",
           "count": 2
       }
   ],
   "address": {
       "comment": "test comment",
       "address": "test address",
       "lastName": "real last name",
       "firstName": "unreal first name"
   }
}
```

PROFILE
GET http://localhost:3000/profile возвращает данные профиля, но помните, что должна быть включена авторизация

IMPORT
POST http://localhost:3000/import?name=test.csv импортирует .csv файл в bucket и добавляет данные из файла в базу данных, если данные имеют правильную структуру. Пример файла находится в корне проекта и называется `import example.csv`
Обязательно надо иметь ?name, и =test.csv имеет проверку на валидность названия файла и расширение. Файл не должен иметь запрещенные слова или символы или иметь недопустимый формат
Данные добавлять в Body - raw, можно 1 объект

```
{
"title": "Manual Product Test Import 3",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
}
```
или можно массив объектов
```
[
{
"title": "Manual Product Test Import 0",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
},
{
"title": "Manual Product Test Import 1",
"price": "799.99",
"description": "Flagship Android phone with Snapdragon 8 Gen 2",
"count": 2,
"imgurl": "https://github.com/HunterTigerX/aws-task-3/blob/task-10/assets/Samsung%20Galaxy%20S23.jpg?raw=true"
}
]
```

Как проверить быстро дополнительное задание
1)Запустить локальное приложение, если оно не было запущено или если было остановлено
2)Выполнить GET запрос по адресу http://localhost:3000/products, к примеру в `Postman`
3)Открыть `https://d138sljllinulj.cloudfront.net/admin/product-form`, создать продукт с любыми данными
4)Выполнить новый GET запрос по адресу http://localhost:3000/products и посмотреть, что продукт, который вы создали, не отображается
5)Можно открыть на сайте главную страницу по адресу `https://d138sljllinulj.cloudfront.net`, чтобы убедиться, что хотя по GET запросу товара нету, но на главной странице он есть.
