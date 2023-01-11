const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const {
  loadContact,
  findContact,
  addContact,
  cekDuplikat,
  deleteContact,
  updateContacts,
} = require("./utils/contacts");
const { body, validationResult, check, cookie } = require("express-validator");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const app = express();
const port = 3000;

// gunakan ejs
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.get("/", (req, res) => {
  res.render("index", {
    title: "halaman utama",
    layout: "layouts/main-layouts",
  });
});
app.get("/about", (req, res) => {
  res.render("about", {
    title: "halaman About",
    layout: "layouts/main-layouts",
  });
});
app.get("/contact", (req, res) => {
  const contacts = loadContact();
  res.render("contact", {
    title: "halaman Contact",
    layout: "layouts/main-layouts",
    contacts,
    msg: req.flash("msg"),
  });
});
//halaman add contact
app.get("/contact/add", (req, res) => {
  const contacts = loadContact();
  res.render("add-contact", {
    title: "Halaman Add Contact",
    layout: "layouts/main-layouts",
    contacts,
  });
});
//proses add data contact
app.post(
  "/contact",
  [
    body("nama").custom((value) => {
      const duplikat = cekDuplikat(value);
      if (duplikat) {
        throw new Error("Nama sudah digunakan");
      }
      return true;
    }),
    check("email", "email tidak valid").isEmail(),
    check("nohp", "no-hp tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render("add-contact", {
        title: "Halaman Add Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
      });
    } else {
      addContact(req.body);
      //kirimkan flash msg
      req.flash("msg", "Data sudah disimpan");
      res.redirect("/contact");
    }
  }
);

//proses delete
app.get("/contact/delete/:nama", (req, res) => {
  const contact = findContact(req.params.nama);

  if (!contact) {
    res.status(404);
    res.send("<h1>404</h1>");
  } else {
    deleteContact(req.params.nama);
    req.flash("msg", "data berhasil dihapus");
    res.redirect("/contact");
  }
});

//halaman edit contact
app.get("/contact/edit/:nama", (req, res) => {
  const contact = findContact(req.params.nama);

  res.render("edit-contact", {
    title: "Halaman Edit Contact",
    layout: "layouts/main-layouts",
    contact,
  });
});

//proses ubah contact
app.post(
  "/contact/update",
  [
    body("nama").custom((value, { req }) => {
      const duplikat = cekDuplikat(value);
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama sudah digunakan");
      }
      return true;
    }),
    check("email", "email tidak valid").isEmail(),
    check("nohp", "no-hp tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render("edit-contact", {
        title: "Halaman Edit Contact",
        layout: "layouts/main-layouts",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      updateContacts(req.body);
      // kirimkan flash msg
      req.flash("msg", "Data sudah diubah");
      res.redirect("/contact");
    }
  }
);

app.get("/contact/:nama", (req, res) => {
  const contact = findContact(req.params.nama);
  res.render("detail", {
    title: "halaman Detail Contact",
    layout: "layouts/main-layouts",
    contact,
  });
});

app.use("/", function (req, res) {
  res.status(404);
  res.send("<h1>404</h1>");
});

app.listen(port, () => {
  console.log(`Example app listening at  http://localhost:${port}`);
});
