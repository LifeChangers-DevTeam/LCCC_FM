fetch("/data/notifications.json")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("notificationCarousel");

    data.items
      .filter(item => item.active)
      .forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "card" + (index === 0 ? " active" : "");
        card.innerHTML = `<img src="${item.image}" alt="${item.title}">`;
        container.appendChild(card);
      });
  });
