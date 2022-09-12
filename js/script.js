// Select DOM elements

const searchForm = document.querySelector(".search");
const searchedResults = document.querySelector(".searched__results");
const chosenIngredients = document.querySelector(".chosen__ingredients");
const btnGo = document.querySelector(".ingredients__btn");
const closeModal = document.querySelector(".close__modal");
const footer = document.querySelector(".footer");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const filterCheckbox = document.querySelector("#ingredients__check");

// API config

const API_URL = "https://api.spoonacular.com"
const KEY = "apiKey=05e4dd292d5548c6a51a0bcd68c953f3";

//Get JSON from API

const getJSON = async function(url){
    try{
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error (`${data.message} (${res.status})`);
        return data;
    }
    catch(err){
        console.log(err);
    }
}

//Generate HTML for the ingredients searched

const generateMarkupIng = function (ing){
    return `
    <li class="preview">
        <div class="preview__img">
            <img src="https://spoonacular.com/cdn/ingredients_100x100/${ing.image}" alt="${ing.name}" style="width: 100%; height:100%;">
        </div>
        <div class="preview__name">
            ${ing.name[0].toUpperCase() + ing.name.slice(1)}
        </div>
    </li>`
}

//Get ingredients and show them

const getIngredient = async function (){
    //Empty the search HTML
    searchedResults.innerHTML = "";

    const query = document.querySelector(".search__field").value;

    const data = await getJSON(`${API_URL}/food/ingredients/autocomplete?${KEY}&query=${query}`);

    data.forEach(ing => {
        let ingredient = generateMarkupIng(ing);
        searchedResults.insertAdjacentHTML("afterbegin", ingredient);
    });
    //Clear search form input:
    document.querySelector(".search__field").value = "";
    //User input unknown ingredient:
    if (data.length == 0) searchedResults.innerHTML = `${query} not recognised as an ingredient, please try another one`
}

// Search for the ingredients

searchForm.addEventListener("submit", function(e){
    e.preventDefault();
    getIngredient();
});

//Generate chosen ingredient Markup

const chosenIngredientsMarkup = function(ing){
    return `<li class="chosen__ing">${ing} <div class="btn__remove">&times;</div> </li>`
}

//Click on chosen ingredient

let ingredients = []; //Initialize empty string with chosen ingredients
let returnedRecipes = []; //Initialize empty string with returned recipes
let recipeName = "";

searchedResults.addEventListener("click", event => {
    
    //Click on ingredient name to add to the ingredients list
    if (event.target.className === "preview__name") {
        const ingredientName = event.target.innerText;
        let ingredientIndex = ingredients.indexOf(ingredientName);

        if (ingredientIndex == -1){
            const ingredient = chosenIngredientsMarkup(ingredientName);
            chosenIngredients.insertAdjacentHTML("beforeend", ingredient);
            ingredients.push(ingredientName);
        }
    
        // Click on recipe name to open modal
    }else if (event.target.className === "name__recipe" && recipeName === ""){
        recipeName = event.target.innerText;
        const recipe = returnedRecipes.find(rec => rec.title === recipeName);
        let recipeURL;
        (async ()=>{
            recipeURL = await sourceURL(recipe.id);
        })().then(()=>{
            if (!modal.hasChildNodes()){
                const modalRecipe = generateModal(recipe, recipeURL);
                modal.insertAdjacentHTML("afterbegin", modalRecipe);
                overlay.classList.remove("hidden");
                modal.classList.remove("hidden");
            }
        })
    }
})

// Remove ingredient from the list

chosenIngredients.addEventListener("click", event =>{

    if (event.target.className === "btn__remove"){
        let ingredientIndex = ingredients.indexOf(event.target.closest("li").innerText.slice(0, -2));
        
        if (ingredientIndex !== -1) ingredients.splice(ingredientIndex, 1);
        
        event.target.closest("li").remove();
    }
});

// Button GO functionality

const getRecipe = async function(arr){
    const ingredients = arr.join(",+");
    let recipes = await getJSON(`${API_URL}/recipes/findByIngredients?${KEY}&ingredients=${ingredients}`);
    
    if (filterCheckbox.checked){
        recipes = recipes.filter(recipe=>recipe.usedIngredientCount === arr.length)
        console.log(recipes);
    }

    //if recipes data lenght is 0 means no recipe found with chosen ingredients by the user
    if (recipes.length == 0){
        searchedResults.textContent = "No recipes found with your ingredients, please try something else :)"
    }
    
    
    returnedRecipes = recipes;
    
    recipes.forEach(recipe => {
        let markup = generateMarkupRecipe(recipe);
        searchedResults.insertAdjacentHTML("afterbegin", markup);
    });
    
}

//Get ingredients with GO button

btnGo.addEventListener("click", async function(){
    searchedResults.innerHTML = ""; // Clear HTML from ingredients searched    
    ingredients.length == 0 ? searchedResults.innerHTML = "Please add ingredients to search for a recipe": getRecipe(ingredients);
});        

// Generate HTML for recipe searched

const generateMarkupRecipe = function(recipe){
    return `
        <li class="preview__recipes">
            <div class="image__recipe">
                <img src="${recipe.image}" alt="${recipe.title}" style="width: 100%; height:100%;">
            </div>
            <div class="name__recipe">${recipe.title}</div>
    </li>`
}

//Fetch recipe sourceURL

const sourceURL = async function(id){
    const data = await getJSON(`${API_URL}/recipes/${id}/information?${KEY}`);
    return await data.sourceUrl;  
}

//Generate modal markup

const generateModal = function(recipe, url){
    const usedIngredients = [];
    const missedIngredients = [];
    recipe.usedIngredients.forEach(ing=>usedIngredients.push(ing.name));
    recipe.missedIngredients.forEach(ing=>missedIngredients.push(ing.name));

    const strUsedIngredients = usedIngredients.join(", ");
    const strMissedIngredients = missedIngredients.join(", ");

    return `
            <div class="close__modal">&times;</div>
            <div class="modal__title">${recipe.title}</div>
            <div class="used__ingredients"><span class="underline">Used ingredients:</span> ${strUsedIngredients}</div><br>
            <div class="missing__ingredients"><span class="underline">Missing ingredients:</span> ${strMissedIngredients}</div><br>
            <div class="recipe__url"><span class="underline">Source URL:</span> <a href="${url}" target=“_blank”>Get me to the recipe!</a></div>
        `
}

//Close modal

document.addEventListener("click", function(e){
    if (e.target.matches(".close__modal") || !e.target.closest(".modal")){
        modal.classList.add("hidden");
        overlay.classList.add("hidden");
        modal.innerHTML = "";
        recipeName = ""
    }
})