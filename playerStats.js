#pragma strict

//floats
private var health:float;
static var maxhealth:float = 300;
private var defense:float;
private var extraDefense:float = 0.0f;
static var maxdefense:float = 50;
private var bubbleHealth:float = 0.0f;
private var semperFlux:float = 100;   //similar to energy or mana from other games
private var boostEnergy:float;
static var maxSemperFlux:float = 500;
static var maxBoostEnergy:float = 100;
private var lt:float = 7f;
private var currentlt:float = 0f;

//ints
var tankCharge:int = 3;
private var ability1:int = 21;
private var ability2:int = 5;
private var ability3:int = 15;
private var ability4:int = 24;
private var metDefense:int = 0;

//booleans
private var dying:boolean = false;
private var sfWaiting:boolean = false;	
private var boostWaiting:boolean = false;	
private var disabled:boolean = false;
var semperRegen:boolean = false;
var stanceRegen:boolean = false;
var increasedSpeed:boolean = false;
var reincarnation:boolean = false;
var boss1:boolean = false;
var boss2:boolean = false;
var boss3:boolean = false;
private var inWater:boolean = false;
private var onFire:boolean = false;
private var dotCanHit = true;
var tankSpecial:boolean = false;
private var grabbyClawed:boolean = false;
private var inBlue:boolean = false;
private var slerping:boolean = false;

//GameObjects
var fireVis:GameObject;
var playerCam:GameObject;
private var Tracker:GameObject;

//Vectors
var target:Vector3;
var curPos:Vector3;
private var center:Vector3;

//Scripts
var playerCamScript:camFollow;
private var photonView:PhotonView;
private var abilities:abilities;
private var movementScript:testhover;
private var shooting:shooting;

function Start () {
	DontDestroyOnLoad (transform.gameObject); //prevents object from being deleted between scenes
	//set stats
	health = maxhealth;
	defense = maxdefense;
	boostEnergy = maxBoostEnergy;
	
	QualitySettings.vSyncCount = 0; //no vSync
	
	Tracker = GameObject.FindGameObjectWithTag("Tracker");//find/set Tracker object
	
	//find/set scripts
	abilities = Tracker.GetComponent("abilities");
	photonView = this.gameObject.GetComponent('PhotonView');
	movementScript = this.gameObject.GetComponent('testhover');
	shooting = this.gameObject.GetComponent('shooting');
	
}

//sets abilities
function selected(abil1:int,abil2:int,abil3:int,abil4:int){
	ability1 = abil1;
	ability2 = abil2;
	ability3 = abil3;
	ability4 = abil4;
}

function Update () {
	if(Input.GetKeyDown(KeyCode.Slash))PhotonNetwork.LoadLevel(5); //testing shortcut to skip to last boss
	
	//death functionality
	if(health <= 0 && !dying && photonView.isMine){
		dying = true;
		onFire = false;
		//reincarnate ability disables and calls
		if(reincarnation){
			var shoot:shooting = this.gameObject.GetComponent('shooting');
			movementScript.disable();
			shoot.disable();
			disable();
			reincarnate();
		}
		//set camera to follow other vehicles & destroy this object
		else if(photonView.isMine){
			playerCamScript = playerCam.GetComponent(camFollow);
			playerCamScript.ownerDeath();
			playerCamScript.ownerDead = true;
			PhotonNetwork.Destroy(this.gameObject);
		}
	}
	//damage over time functionality
	if(dotCanHit){
		dotCanHit = false;
		if(onFire){
			//calls damage function
			photonView.RPC("hitPlayer", PhotonTargets.All, abilities.getAbilityDmg('onFire',0),abilities.getAbilityDmg('onFire',1));
		}
		dotWait();
	}
}

//damage over time wait
function dotWait(){
	yield WaitForSeconds(.1);
	dotCanHit = true;
}

function FixedUpdate(){
	if(!disabled){
		//semperFLux gain over time
		if(semperFlux < maxSemperFlux){
			sfIncrease();
		}
		else{
			semperFlux = maxSemperFlux;
		}
		//boostEnergy gain over time
		if(boostEnergy < maxBoostEnergy){
			boostIncrease();
		}
		else{
			boostEnergy = maxBoostEnergy;
		}
	}
	//boss3 reset player mechanic
	if(slerping){
		currentlt += Time.deltaTime;
		if(currentlt > lt) currentlt = lt;
		transform.position = Vector3.Slerp(curPos, target, currentlt/lt);
		transform.position += center;
		transform.rotation = Quaternion.Lerp(transform.rotation,Quaternion.identity, currentlt/lt);
	}
	//defense checks
	if(defense < 0) defense = 0;
	if(defense > maxdefense) defense = maxdefense;
}

//boost regen
function boostIncrease(){
	if(!boostWaiting){
		boostEnergy += 1;
		boostWaiting = true;
		yield WaitForSeconds(.1);
		boostWaiting = false;	

	}
}

//semperflux regen
function sfIncrease(){
	if(!sfWaiting){
		semperFlux += 1; 
		//passive regen ability 
		if(semperRegen == true){
			semperFlux += .5;
		}
		//metatasis regen ability
		if(stanceRegen == true) semperFlux += .5;
		sfWaiting = true;
		yield WaitForSeconds(.1);
		sfWaiting = false;	
	}
}

//------ Getters ------
function getAbility(abil:int){
	switch(abil){
		case 0: break;
		case 1: 
			abil = ability1;
			break;
		case 2:
			abil = ability2;
			break;
		case 3:
			abil = ability3;
			break;
		case 4:
			abil = ability4;
			break;
	}
	return abil;
}

function getHealth(){
	return health;
}

function getSF(){
	return semperFlux;
}

function getBoost(){
	return boostEnergy;
}

function getDefense(){
	return defense;
}

function setBubble(hp:float){
	bubbleHealth = hp;
}

function getBubble(){
	return bubbleHealth;
}

//------ End Getters ------

//semperflux calculation
function sfCalc(cost:int){
	semperFlux -= cost;
}

//switching metatasis stances
function setMetDef(d:int){
	metDefense = d;
}

//defense aura stats/functionality
function defAura(){
	if(extraDefense == 0){
		extraDefense = 50;
		print('defaura');
		yield WaitForSeconds(10);
		extraDefense = 0;
	}
}

//tank vehicle special functionality
function tankSpecialAbility(){
	if(tankCharge > 0){
		tankCharge --;
		tankSpecial = true;
		yield WaitForSeconds(3);
		tankSpecial = false;
		tankSpecialWait();
	}
}

//tank vehicle special reload charges
function tankSpecialWait(){
	yield WaitForSeconds(30);
	tankCharge ++;
}

//rein ability functionality
function reincarnate(){
	yield WaitForSeconds(6.5);
	health = 100;
	reincarnation = false;
	dying = false;
}

function OnTriggerEnter(col:Collider){
	if(col.gameObject.tag == "SmallSemper"){
		semperFlux += 10;
		PhotonNetwork.Destroy(col.gameObject);
	}
	if(col.gameObject.tag == "repairTurretHit"){
		defense += 8;
		if(defense > maxdefense) defense = maxdefense;
	}
	if(col.gameObject.tag == "DefenseAura"){
		defAura();
	}
	if(col.gameObject.tag == "DefensePulse"){
		defense += 2;
		if(defense > maxdefense) defense = maxdefense;
	}
	if(col.gameObject.tag == "bossRoom1")boss1 = true;
	if(col.gameObject.tag == "bossRoom1End"){
		boss1 = false;
		var guiScript:guiScript = this.gameObject.GetComponent("guiScript");
		guiScript.bossActive = false;
		//PhotonNetwork.LoadLevel(3);
	}
	if(col.gameObject.tag == "boss2Start"){
		if(PhotonNetwork.isMasterClient){
			PhotonNetwork.LoadLevel(3);
			var Tracker = GameObject.FindGameObjectWithTag("Tracker");
			var netwirk:netwirk = Tracker.GetComponent("netwirk");
			netwirk.boss2 = false;
		}
	}
	if(col.gameObject.tag == "boss3Start"){
		boss2 = false;
		var guiScriptt:guiScript = this.gameObject.GetComponent("guiScript");
		guiScriptt.bossActive = false;
		boss3 = true;
	}
	if(col.gameObject.tag == "Tornado"){ disable(); boss3Reset();}
	if(col.gameObject.tag == "boss2Bars") boss2 = true;
	if(col.gameObject.tag == "water"){ inWater = true; onFire = false; fireVis.active = false;}
	if(col.gameObject.tag == "Burn"){ if(!inWater) onFire = true; fireVis.active = true;}
}

function OnTriggerExit(col:Collider){
	if(col.gameObject.tag == "magicRing" && transform.position.y < 9.5) hitPlayer(50,25);
	if(col.gameObject.tag == "water") inWater = false;
}

function OnCollisionEnter(col:Collision){
	if(col.gameObject.tag == "disableShot") disable();
	else if(col.gameObject.tag == "Boulder"){
		disable();
		boss3Reset();
	}
}

//uses slerping in FixedUpdate
function boss3Reset(){
	currentlt = 0f;
	curPos = transform.position;
	target = new Vector3(Random.Range(-75.0f, 75.0f), 10, -480);
	center = (curPos + target) * 0.5;
	center -= Vector3(0,1,0);
	target = target - center;
	curPos = curPos - center;
	slerping = true;
	yield WaitForSeconds(7);
	slerping = false;
}

//prevents all functionality & movement for 7s
function disable(){
	disabled = true;
	if(shooting)shooting.disable();
	yield WaitForSeconds(7);
	disabled = false;
	if(shooting)shooting.disableEnd();
}

//prevents all functionality & movement
@RPC
function bossDisable(id:int){
	disabled = true;
	grabbyClawed = true;
	if(movementScript)movementScript.bossDisable(id);
	if(shooting)shooting.disable();
}

//enables all functionality & movement
@RPC
function bossDisableEnd(){
	disabled = false;
	if(movementScript)movementScript.bossDisableEnd();
	if(shooting)shooting.disableEnd();
}

//boss4 claw grab ability
@RPC
function followClawEnd(){
	if(movementScript)movementScript.followClawEnd();
}

//boss4 damage reduction
@RPC
function blueZone(b:boolean){
	inBlue = b;
}

//damaging player
@RPC
function hitPlayer(dmgA:float,defDmgA:float){
	var dmg:float = dmgA; //incoming damage
	var defDmg:float = defDmgA; //incoming defense damage
	var curDef:float = defense+extraDefense+metDefense; //current defense with added defense from abilities
	if(curDef > 100) curDef = 100; //check for defense over cap
	if(dmg > 0){	//check for damage over 0
		dmg = dmg - (dmg *((curDef)/100)); //damage to be done after defense reduction
		if(tankSpecial)dmg = dmg * .33; //damage to be done after tank special reduction
		if(inBlue) dmg = dmg*.5;	//damage to be done after boss4 blue zone reduction
		if((bubbleHealth > 0) && dmg > 0){ //shield ability check 
			bubbleHealth -= dmg; //damaging shield
			if(bubbleHealth <= 0){ //check for extra damage after bubble
				
				dmg = Mathf.Abs(bubbleHealth);
				
				health = health - dmg; //damaging player
			}
		}
		else{
			health = health - dmg; //damaging player if extra damage from bubble
		}
	}
	else{
		health = health - dmg; //damaging player if no bubble
	}
	if(health > maxhealth){ //check for health over cap
		health = maxhealth; //set health to cap
	}
	defense -= defDmg; //damaging defense
	if(defense > maxdefense) defense = maxdefense;	//check & set defense to cap
}

