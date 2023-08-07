const clientId = "55a6b418a96c42b1913e34ea18e9e377";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

let done = false;
if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const toparts = await topartists(accessToken);
    const topsons = await topsongs(accessToken);
    const playlist = await playlists(accessToken);
    const rec = await recent(accessToken);
    populateUI(accessToken, profile, toparts.items, topsons.items, playlist.items, rec.items, "127817");
    var tasknum = document.getElementById("task");
    tasknum.onchange = function () {
        rangechange(accessToken, profile, playlist.items, "-");
    }
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "playlist-read-private user-read-recently-played user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function topartists(token) {
    var tokstr = "Bearer " + token;
    var term = "";
    if (document.getElementById("task").value == "1") {
        term = "short_term";
    }
    else if (document.getElementById("task").value == "2") {
        term = "medium_term";
    }
    else {
        term = "long_term";
    }
    const result = await fetch("https://api.spotify.com/v1/me/top/artists?limit=100&time_range=" + term, {
        method: "GET", headers: { Authorization: tokstr }
    });
    return await result.json();
}

async function playlists(token) {
    var tokstr = "Bearer " + token;
    const result = await fetch("https://api.spotify.com/v1/me/playlists?limit=30", {
        method: "GET", headers: { Authorization: tokstr }
    });
    return await result.json();
}

async function recent(token) {
    var tokstr = "Bearer " + token;
    const result = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
        method: "GET", headers: { Authorization: tokstr }
    });
    return await result.json();
}

async function topsongs(token) {
    var tokstr = "Bearer " + token;
    var term = "";
    if (document.getElementById("task").value == "1") {
        term = "short_term";
    }
    else if (document.getElementById("task").value == "2") {
        term = "medium_term";
    }
    else {
        term = "long_term";
    }
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=100&time_range=" + term, {
        method: "GET", headers: { Authorization: tokstr }
    });
    return await result.json();
}

async function populateUI(token, profile, toparts, topsongs, playlists, recents, emoji) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(60, 60);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
    }
    document.getElementById("items").innerHTML += "<br>"
    //document.getElementById("items").innerText = toparts;
    var fcount = 0;
    document.getElementById("items").innerHTML = "<strong>Your top artists:</strong><br>";
    for (let i = 0; i < toparts.length; i++) {
        var num = i + 1;

        document.getElementById("items").innerHTML += num + ". " + toparts[i].name + "<br>";

    }
    var perc = fcount * 2;
    var fcount2 = 0;
    var song1 = topsongs[0];
    var song2 = topsongs[1];
    var song3 = topsongs[2];
    document.getElementById("songs").innerHTML = "<strong>Your top songs:</strong> <br>"
    for (let i = 0; i < topsongs.length; i++) {
        var num = i + 1;
        var artists = topsongs[i].artists;
        document.getElementById("songs").innerHTML += num + ". " + topsongs[i].name + "<br>";

    }
    perc = fcount2 * 2;
    var fcount3 = 0;
    var recarr = [];
    document.getElementById("recents").innerHTML = "<strong>Your recently played songs:</strong><br>"
    for (let i = 0; i < recents.length; i++) {
        var track = recents[i].track;
        console.log(track.artists.length);
        var num = i + 1;
        document.getElementById("recents").innerHTML += num + ". " + track.name + "<br>";

    }
    perc = fcount3 * 2;
    var plists = [];
    //done = true; //*******
    if (done != true) {
        var playcount = 0;
        for (let i = 0; i < playlists.length; i++) {
            var name = playlists[i].name;
            var owner = playlists[i].owner.display_name;
            var numitems = playlists[i].tracks.total;
            var d = {};
            const img = new Image(20, 20);
            img.src = playlists[i].images[0].url;
            var link = playlists[i].tracks.href;
            var f = await playarts(token, link, name);
            if (owner == document.getElementById("displayName").innerText) {
                playcount += 1;
                document.getElementById("playlists").innerHTML += "<span id=miniplaylists>"
                document.getElementById("playlists").appendChild(img);
                document.getElementById("playlists").innerHTML += "  " + name + " - " + owner + " (" + numitems + " tracks)</span>";
                var plist = f.array;
                plists.push(plist);
                var maxpercent = parseInt(f.maxes[0][2] * 100) / 100;
                document.getElementById("playlists").innerHTML += "<br>top artists: <br>" + f.maxes[0][0] + "; " + f.maxes[0][1] + " songs <br>" + f.maxes[1][0] + "; " + f.maxes[1][1] + " songs <br>" + f.maxes[2][0] + "; " + f.maxes[2][1] + " songs <br>";
            }
            done = true;
        }
    }
    var toptrack = 0;
    var topscore = 0;
    var sectrack = 0;
    var secscore = 0;
    var thirdtrack = 0;
    var thirdscore = 0;
    for (let i = 0; i < topsongs.length; i++) {
        var score = 0;
        score = (50 - (i + 1)) * 3;

        if (recarr.includes(topsongs[i])) {
            score += 10;
        }
        for (let j = 0; j < plists.length; j++) {
            if (plists[j].includes(topsongs[i])) {
                score += 5;
            }
        }
        if (toparts.includes(topsongs[i].artists[0])) {
            score += 3;
        }
        if (score > topscore) {
            thirdscore = secscore;
            thirdtrack = sectrack;
            secscore = topscore;
            sectrack = toptrack;
            topscore = score;
            toptrack = topsongs[i];
        }
        else if (score > secscore) {
            thirdscore = secscore;
            thirdtrack = sectrack;
            secscore = score;
            sectrack = topsongs[i];
        }
        else if (score > thirdscore) {
            thirdscore = score;
            thirdtrack = topsongs[i];
        }
    }
    //populate top track thingy!
    toptrack = song1;
    sectrack = song2;
    thirdtrack = song3;
    console.log(toptrack);
    const topimg = new Image(130, 130);
    if (toptrack.album != null && toptrack.album.images != null && toptrack.album.images.length > 0) {
        topimg.src = toptrack.album.images[0].url;
        document.getElementById("favsong").appendChild(topimg);
    }
    document.getElementById("favsong").innerHTML += "<br><span id=favsongtitle>" + toptrack.name + "</span><br>" + toptrack.artists[0].name + "<br style='margin-bottom:5px'>";
    var tempurl = toptrack.preview_url;
    const prev = new Audio(tempurl);
    prev.controls = true;
    prev.width = 100;
    prev.height = 40;
    document.getElementById("favsong").appendChild(prev);

    const topimg2 = new Image(130, 130);
    if (sectrack.album != null && sectrack.album.images != null && sectrack.album.images.length > 0) {
        topimg2.src = sectrack.album.images[0].url;
        document.getElementById("favsong2").appendChild(topimg2);
    }
    document.getElementById("favsong2").innerHTML += "<br><span id=favsongtitle>" + sectrack.name + "</span><br>" + sectrack.artists[0].name + "<br style='margin-bottom:5px'>";
    var tempurl = sectrack.preview_url;
    const prev2 = new Audio(tempurl);
    prev2.controls = true;
    prev2.width = 100;
    prev2.height = 40;
    document.getElementById("favsong2").appendChild(prev2);

    const topimg3 = new Image(130, 130);
    if (thirdtrack.album != null && thirdtrack.album.images != null && thirdtrack.album.images.length > 0) {
        topimg3.src = thirdtrack.album.images[0].url;
        document.getElementById("favsong3").appendChild(topimg3);
    }
    document.getElementById("favsong3").innerHTML += "<br><span id=favsongtitle>" + thirdtrack.name + "</span><br>" + thirdtrack.artists[0].name + "<br style='margin-bottom:5px'>";
    var tempurl = thirdtrack.preview_url;
    const prev3 = new Audio(tempurl);
    prev3.controls = true;
    prev3.width = 100;
    prev3.height = 40;
    document.getElementById("favsong3").appendChild(prev3);
}

async function playarts(accessToken, link, name) { //EDIT THIS FUNCTION. NO FMAX
    var result = await playsub(accessToken, link);
    //console.log(result);
    var its = []
    while (result.next != null) {
        its = its.concat(result.items);
        result = await playsub(accessToken, result.next);
    }
    its = its.concat(result.items);
    var r = its;
    var total = r.length;
    var farr = [];
    var dic = {};
    var max1 = ["", 0];
    var max2 = ["", 0];
    var max3 = ["", 0];
    for (let i = 0; i < total; i++) {
        if (r[i].track == null) {
            console.log(total);
            console.log(i);
        }
        else {
            for (let j = 0; j < r[i].track.artists.length; j++) {
                if (dic[r[i].track.artists[j].name] == null) {
                    dic[r[i].track.artists[j].name] = 1;
                }
                else {
                    dic[r[i].track.artists[j].name] += 1;
                }
                if (max1[1] < dic[r[i].track.artists[j].name] && r[i].track.artists[j].name == max1[0]) {
                    max1 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
                else if (max1[1] < dic[r[i].track.artists[j].name]) {
                    max3 = max2;
                    max2 = max1;
                    max1 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
                else if (max2[1] < dic[r[i].track.artists[j].name] && r[i].track.artists[j].name == max2[0]) {
                    max2 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
                else if (max2[1] < dic[r[i].track.artists[j].name]) {
                    max3 = max2;
                    max2 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
                else if (max3[1] < dic[r[i].track.artists[j].name]) {
                    max3 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
            }
            farr.push(r[i].track);
        }
    }
    if (max3[0] == max1[0]) {
        max3 = [0, 0]
        for (let i = 0; i < total; i++) {
            for (let j = 0; j < r[i].track.artists.length; j++) {
                if (!(r[i].track.artists[j].name == max1[0] || r[i].track.artists[j].name == max2[0]) && dic[r[i].track.artists[j].name] > max3[1]) {
                    max3 = [r[i].track.artists[j].name, dic[r[i].track.artists[j].name]]
                }
            }
        }
    }
    max1 = [max1[0], max1[1], 100 * max1[1] / total];
    max2 = [max2[0], max2[1], 100 * max2[1] / total];
    max3 = [max3[0], max3[1], 100 * max3[1] / total];
    //console.log(perc);
    return { "array": farr, "maxes": [max1, max2, max3] };
}

async function playsub(token, link) {
    var tokstr = "Bearer " + token;
    const result = await fetch(link, {
        method: "GET", headers: { Authorization: tokstr }
    });
    return await result.json();
}

async function rangechange(accessToken, profile, playlists, emoji) {
    const toparts2 = await topartists(accessToken);
    const topsons2 = await topsongs(accessToken);
    const rec = await recent(accessToken);
    document.getElementById("avatar").innerHTML = "";
    document.getElementById("songs").innerHTML = "";
    document.getElementById("items").innerHTML = "";
    document.getElementById("favsong").innerHTML = "";
    document.getElementById("favsong2").innerHTML = "";
    document.getElementById("favsong3").innerHTML = "";
    document.getElementById("recents").innerHTML = "";
    populateUI(accessToken, profile, toparts2.items, topsons2.items, playlists, rec.items, emoji);
}