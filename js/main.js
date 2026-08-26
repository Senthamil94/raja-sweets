(function () {
  "use strict";

  var $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  var $$ = function (selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  };

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Thu–Tue 10:00–21:00, Wed 10:00–21:30. Index 0 = Sunday. */
  var HOURS = [
    { o: 600, c: 1260 },
    { o: 600, c: 1260 },
    { o: 600, c: 1260 },
    { o: 600, c: 1290 },
    { o: 600, c: 1260 },
    { o: 600, c: 1260 },
    { o: 600, c: 1260 }
  ];

  var DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  /* ---- loader ---- */
  (function () {
    var bar = $("#ldBar");
    if (!bar) return;

    var progress = 0;
    var fired = false;
    var tick = setInterval(function () {
      progress += Math.random() * 18 + 7;
      if (progress >= 100) {
        progress = 100;
        clearInterval(tick);
      }
      bar.style.width = progress + "%";
    }, 130);

    function done() {
      if (fired) return;
      fired = true;
      clearInterval(tick);
      bar.style.width = "100%";
      setTimeout(function () {
        document.body.classList.add("loaded");
      }, 240);
    }

    if (document.readyState !== "loading") {
      setTimeout(done, 650);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(done, 650);
      });
    }

    setTimeout(done, 2500);
  })();

  /* ---- hero background rotation ---- */
  (function () {
    var backgrounds = $$(".hero__bg");
    var dots = $$("#heroDots i");
    if (backgrounds.length < 2 || REDUCED) return;

    var index = 0;
    setInterval(function () {
      backgrounds[index].classList.remove("is-on");
      if (dots[index]) dots[index].classList.remove("on");
      index = (index + 1) % backgrounds.length;
      backgrounds[index].classList.add("is-on");
      if (dots[index]) dots[index].classList.add("on");
    }, 6000);
  })();

  /* ---- nav / progress / back to top ---- */
  (function () {
    var nav = $("#nav");
    var prog = $("#prog");
    var totop = $("#totop");
    if (!nav) return;

    var last = 0;

    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle("is-stuck", y > 40);

      if (!nav.classList.contains("is-open")) {
        nav.classList.toggle("is-hidden", y > 460 && y > last);
      }

      last = y;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (height > 0 ? (y / height) * 100 : 0) + "%";
      if (totop) totop.classList.toggle("is-on", y > 700);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (totop) {
      totop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: REDUCED ? "auto" : "smooth"
        });
      });
    }

    var links = $$("#navLinks a");
    var map = {};

    links.forEach(function (link) {
      var el = document.querySelector(link.getAttribute("href"));
      if (el) map[link.getAttribute("href")] = el;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            var isCurrent = map[link.getAttribute("href")] === entry.target;
            link.setAttribute("aria-current", isCurrent ? "true" : "false");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    Object.keys(map).forEach(function (key) {
      observer.observe(map[key]);
    });
  })();

  /* ---- reveals + counters ---- */
  (function () {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    $$(".rv").forEach(function (el) {
      revealObserver.observe(el);
    });

    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);

          var el = entry.target;
          var to = parseInt(el.dataset.count, 10);
          var suffix = el.dataset.suffix || "";

          if (REDUCED) {
            el.textContent = to + suffix;
            return;
          }

          var duration = 1400;
          var start = performance.now();

          (function step(now) {
            var p = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
            if (p < 1) requestAnimationFrame(step);
          })(start);
        });
      },
      { threshold: 0.5 }
    );

    $$("[data-count]").forEach(function (el) {
      countObserver.observe(el);
    });
  })();

  /* ---- live opening hours (Pacific) ---- */
  (function () {
    function ptNow() {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(new Date());

      var values = {};
      parts.forEach(function (part) {
        values[part.type] = part.value;
      });

      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

      return {
        d: days[values.weekday],
        m: (parseInt(values.hour, 10) % 24) * 60 + parseInt(values.minute, 10)
      };
    }

    function hhmm(minutes) {
      var h = Math.floor(minutes / 60);
      var m = minutes % 60;
      var suffix = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return h + ":" + String(m).padStart(2, "0") + " " + suffix;
    }

    var time = ptNow();
    var today = HOURS[time.d];
    var open;
    var text;

    if (time.m >= today.o && time.m < today.c) {
      open = true;
      text = "Open Now · Until " + hhmm(today.c);
    } else if (time.m < today.o) {
      open = false;
      text = "Closed · Opens " + hhmm(today.o) + " Today";
    } else {
      open = false;
      text = "Closed · Opens " + hhmm(HOURS[(time.d + 1) % 7].o) + " Tomorrow";
    }

    ["#statusTop", "#statusHero"].forEach(function (selector) {
      var el = $(selector);
      if (el) el.textContent = text;
    });

    ["#dotTop", "#dotHero"].forEach(function (selector) {
      var el = $(selector);
      if (el) el.classList.toggle("is-shut", !open);
    });

    $$("[data-status]").forEach(function (el) {
      el.textContent = text;
      var dot = el.parentElement.querySelector(".dot");
      if (dot) dot.classList.toggle("is-shut", !open);
    });

    $$("[data-hours]").forEach(function (box) {
      box.innerHTML = DAYS.map(function (day, i) {
        var todayClass = i === time.d ? ' class="is-today"' : "";
        return (
          "<div" +
          todayClass +
          "><span>" +
          day +
          "</span><span>" +
          hhmm(HOURS[i].o) +
          " – " +
          hhmm(HOURS[i].c) +
          "</span></div>"
        );
      }).join("");
    });

    var year = $("#yr");
    if (year) year.textContent = new Date().getFullYear();
  })();

  /* ---- image fallback ---- */
  $$("img").forEach(function (img) {
    img.addEventListener("error", function () {
      if (img.closest(".nav__logo, .loader__in, .foot")) return;
      img.style.display = "none";
      if (img.parentElement) img.parentElement.classList.add("img-missing");
    });
  });

  /* ---- FAQ accordion: one open at a time ---- */
  (function () {
    var items = $$(".faq details");
    if (!items.length) return;

    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  })();
})();
