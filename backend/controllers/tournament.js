const Torneo = require("../models/Tournament");
const TournamentEntry = require("../models/TournamentEntry");
const Usuario = require("../models/User");

const obtener_torneos = async (req, res) => {
  try {
    const torneos = await Torneo.find().populate("authorId", "username");
    res.status(200).json(torneos);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const obtener_torneos_disponibles = async (req, res) => {
  try {
    const now = new Date();
    const torneos = await Torneo.find({
      isFull: false,
      tournament_date_hour: { $gt: now },
      $or: [
        { registration_deadline: null },
        { registration_deadline: { $gt: now } },
      ],
    }).populate("authorId", "username");
    res.status(200).json(torneos);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const obtener_torneo = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id).populate(
      "authorId",
      "username",
    );
    if (!torneo) return res.status(404).json("Torneo no encontrado");
    else {
      res.status(200).json(torneo);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const toggle_fav = async (req, res) => {
  try {
    const torneoToFav = await Torneo.findById(req.params.id);
    const myself = await Usuario.findById(req.user.id);
    if (!torneoToFav) return res.status(404).json("Recurso no encontrado");
    else if (!myself)
      return res
        .status(401)
        .json("No se ha podido determinar el usuario de la sesion");
    else if (
      myself.fav_tournament.some(
        (fav_tournament_obj) =>
          fav_tournament_obj._id.toString() === torneoToFav._id.toString(),
      )
    ) {
      await Usuario.updateOne(
        { _id: req.user.id },
        { $pull: { fav_tournament: torneoToFav._id } },
      );
      res.status(200).json("Eliminacion de favorito procesado con exito");
    } else {
      await Usuario.updateOne(
        { _id: req.user.id },
        { $push: { fav_tournament: torneoToFav } },
      );
      res.status(200).json("Favorito procesado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const delete_tournament = async (req, res) => {
  try {
    const torneoToDelete = await Torneo.findById(req.params.id);
    const myself = await Usuario.findById(req.user.id);
    if (!torneoToDelete) return res.status(404).json("Recurso no encontrado");
    else if (!myself)
      return res
        .status(401)
        .json("No se ha podido determinar el usuario de la sesion");
    else if (!myself.isAdmin && !torneoToDelete.authorId.equals(myself._id))
      return res.status(403).json("No tienes permiso para borrar eso");
    else {
      await Usuario.updateMany(
        { fav_tournament: torneoToDelete._id },
        { $pull: { fav_tournament: torneoToDelete._id } },
      );
      await torneoToDelete.deleteOne();
      res.status(200).json("Borrado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const post_tournament = async (req, res) => {
  try {
    if (!req.user.isVerified && !req.user.isAdmin)
      return res.status(403).json("Solo tiendas verificadas o administradores pueden crear torneos");
    const newTournament = new Torneo({
      authorId: req.user.id,
      ubication: req.body.ubication,
      name: req.body.name,
      description: req.body.description,
      format: req.body.format,
      enter_cost: req.body.enter_cost,
      prizes: req.body.prizes,
      ruling_markdown: req.body.ruling_markdown,
      tournament_date_hour: req.body.tournament_date_hour,
      max_players: req.body.max_players ?? null,
      auto_accept_participants: req.body.auto_accept_participants ?? false,
      needs_decklist: req.body.needs_decklist ?? false,
      reserve_non_confirmed_places: req.body.reserve_non_confirmed_places ?? true,
      registration_deadline: req.body.registration_deadline ?? null,
    });
    await newTournament.save();
    res.status(201).json(newTournament);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const get_saved_tournaments = async (req, res) => {
  try {
    const myself = await Usuario.findById(req.user.id).populate({
      path: "fav_tournament",
      populate: { path: "authorId", select: "username" },
    });
    if (!myself) return res.status(401).json("No se ha podido determinar el usuario de la sesion");
    res.status(200).json(myself.fav_tournament);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const patch_tournament = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    const myself = await Usuario.findById(req.user.id);
    if (!torneo) return res.status(404).json("Torneo no encontrado");
    if (!myself) return res.status(401).json("No se ha podido determinar el usuario de la sesion");
    if (!myself.isAdmin && !torneo.authorId.equals(myself._id))
      return res.status(403).json("No tienes permiso para editar eso");

    const allowed = ["name", "description", "format", "enter_cost", "ubication", "tournament_date_hour", "max_players", "prizes", "ruling_markdown", "isFull", "auto_accept_participants", "needs_decklist", "reserve_non_confirmed_places", "registration_deadline"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) torneo[key] = req.body[key];
    });
    await torneo.save();
    await torneo.populate("authorId", "username");
    res.status(200).json(torneo);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const get_organized_tournaments = async (req, res) => {
  try {
    if (!req.user.isVerified && !req.user.isAdmin)
      return res.status(403).json("Solo tiendas verificadas o administradores pueden acceder");

    const torneos = await Torneo.find({ authorId: req.user.id }).sort({ tournament_date_hour: -1 }).lean();
    if (!torneos.length) return res.status(200).json([]);

    const tournamentIds = torneos.map((t) => t._id);
    const counts = await TournamentEntry.aggregate([
      { $match: { tournamentId: { $in: tournamentIds } } },
      { $group: { _id: { tournamentId: "$tournamentId", status: "$status" }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const c of counts) {
      const tid = c._id.tournamentId.toString();
      if (!countMap[tid]) countMap[tid] = { pending: 0, accepted: 0, rejected: 0 };
      countMap[tid][c._id.status] = c.count;
    }

    const enriched = torneos.map((t) => ({
      ...t,
      entry_counts: countMap[t._id.toString()] ?? { pending: 0, accepted: 0, rejected: 0 },
    }));

    res.status(200).json(enriched);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const get_my_entry = async (req, res) => {
  try {
    const entry = await TournamentEntry.findOne({
      tournamentId: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json(entry ?? null);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const join_tournament = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    if (!torneo) return res.status(404).json("Torneo no encontrado");
    if (torneo.isFull) return res.status(409).json("El torneo está completo");

    const now = new Date();
    if (torneo.registration_deadline && torneo.registration_deadline < now)
      return res.status(409).json("El plazo de inscripción ha finalizado");

    const sessionUser = res.session?.authenticated ? res.session.user : null;
    const myself = sessionUser ? await Usuario.findById(sessionUser.id) : null;

    const alreadyIn = await TournamentEntry.findOne({
      tournamentId: torneo._id,
      ...(myself ? { userId: myself._id } : { username_snapshot: req.body.username_snapshot }),
      status: { $ne: "rejected" },
    });
    if (alreadyIn) return res.status(409).json("Ya estás inscrito en este torneo");

    if (torneo.needs_decklist && !req.body.decklistId && !req.body.cards?.length)
      return res.status(400).json("Este torneo requiere una decklist");

    const status = torneo.auto_accept_participants ? "accepted" : "pending";

    const entry = new TournamentEntry({
      tournamentId: torneo._id,
      userId: myself?._id ?? null,
      username_snapshot: myself?.username ?? req.body.username_snapshot,
      status,
      title: req.body.title ?? null,
      commander: req.body.commander ?? [],
      cards: req.body.cards ?? [],
      color_identity: req.body.color_identity ?? "",
      card_images: req.body.card_images ?? {},
      card_types: req.body.card_types ?? {},
      decklistId: req.body.decklistId ?? null,
    });
    await entry.save();

    if (torneo.max_players) {
      const countQuery = { tournamentId: torneo._id };
      if (torneo.reserve_non_confirmed_places) {
        countQuery.status = { $in: ["pending", "accepted"] };
      } else {
        countQuery.status = "accepted";
      }
      const count = await TournamentEntry.countDocuments(countQuery);
      if (count >= torneo.max_players) {
        await Torneo.updateOne({ _id: torneo._id }, { isFull: true });
      }
    }

    res.status(201).json(entry);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const get_entries = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    if (!torneo) return res.status(404).json("Torneo no encontrado");

    const myself = await Usuario.findById(req.user.id);
    if (!myself) return res.status(401).json("No se ha podido determinar el usuario de la sesion");
    if (!myself.isAdmin && !torneo.authorId.equals(myself._id))
      return res.status(403).json("No tienes permiso para ver las inscripciones");

    const entries = await TournamentEntry.find({ tournamentId: torneo._id })
      .populate("userId", "username")
      .sort({ submitted_at: 1 });
    res.status(200).json(entries);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const patch_entry = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    const entry = await TournamentEntry.findById(req.params.entryId);
    if (!torneo || !entry) return res.status(404).json("Recurso no encontrado");
    if (!entry.tournamentId.equals(torneo._id)) return res.status(400).json("La inscripción no pertenece a este torneo");

    const myself = await Usuario.findById(req.user.id);
    if (!myself) return res.status(401).json("No se ha podido determinar el usuario de la sesion");
    const isOrganizer = myself.isAdmin || torneo.authorId.equals(myself._id);

    if (!isOrganizer) return res.status(403).json("No tienes permiso para modificar esta inscripción");

    const allowed = ["status", "placement", "metadata"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) entry[key] = req.body[key];
    });
    await entry.save();

    if (torneo.max_players) {
      const countQuery = { tournamentId: torneo._id };
      countQuery.status = torneo.reserve_non_confirmed_places
        ? { $in: ["pending", "accepted"] }
        : "accepted";
      const count = await TournamentEntry.countDocuments(countQuery);
      const shouldBeFull = count >= torneo.max_players;
      if (torneo.isFull !== shouldBeFull)
        await Torneo.updateOne({ _id: torneo._id }, { isFull: shouldBeFull });
    }

    res.status(200).json(entry);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const delete_entry = async (req, res) => {
  try {
    const torneo = await Torneo.findById(req.params.id);
    const entry = await TournamentEntry.findById(req.params.entryId);
    if (!torneo || !entry) return res.status(404).json("Recurso no encontrado");
    if (!entry.tournamentId.equals(torneo._id)) return res.status(400).json("La inscripción no pertenece a este torneo");

    const myself = await Usuario.findById(req.user.id);
    if (!myself) return res.status(401).json("No se ha podido determinar el usuario de la sesion");
    const isOrganizer = myself.isAdmin || torneo.authorId.equals(myself._id);
    const isOwner = entry.userId && entry.userId.equals(myself._id);
    if (!isOrganizer && !isOwner)
      return res.status(403).json("No tienes permiso para cancelar esta inscripción");

    await entry.deleteOne();

    if (torneo.isFull) {
      await Torneo.updateOne({ _id: torneo._id }, { isFull: false });
    }

    res.status(200).json("Inscripción cancelada");
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

module.exports = {
  obtener_torneos,
  obtener_torneos_disponibles,
  obtener_torneo,
  toggle_fav,
  delete_tournament,
  post_tournament,
  patch_tournament,
  get_saved_tournaments,
  get_organized_tournaments,
  join_tournament,
  get_my_entry,
  get_entries,
  patch_entry,
  delete_entry,
};
