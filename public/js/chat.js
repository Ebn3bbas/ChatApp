const socket = io();

//Elements
const chatForm = document.querySelector("#form");
const input = chatForm.querySelector("input");
const button = chatForm.querySelector("button");
const locationButt = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;
  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;
  // Visible height
  const visibleHeight = messages.offsetHeight;
  // Height of messages container
  const containerHeight = messages.scrollHeight;
  // How far have I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;
  // Scroll to bottom
  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("locationMessage", ({ username, url, createdAt }) => {
  console.log(url);
  const html = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("message", ({ username, text, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    username,
    text,
    createdAt: moment(createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //disable
  button.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    button.removeAttribute("disabled");
    input.value = "";
    input.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered ");
  });
});

locationButt.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geoloction is not supported");
  }

  locationButt.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("location shared!");
        locationButt.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
