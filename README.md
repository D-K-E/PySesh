# PySesh
A Python NLP Complement to Jsesh
--------
This project is a reimplementation of Michele Moglia's project on lunchpad, see: https://launchpad.net/pysesh
    
  Our goal with this project is to implement slowly some of the functions of Jsesh for mass treatement of encoded egyptian texts.  The milestones are currently being discussed with M. Serge Rosmorduc, the developper of Jsesh. 
  After our recent discussions with M.Rosmorduc, following goals are established:
  
  ** Pysesh will aspire to be a nlp library for ancient egyptian.
  ** 0.5 Create parsers to facilitate the interaction between MdC text and python built-in types.
  ** 1. Create facilities to prepare the signs of a Jsesh output for training taggers (this shouldn't take too much time)
  ** 2. Prepare several corpora for training the taggers (This will take long since every sign has to be evaluated)
  ** 3. 2 models: HMM and CRF will be adopted as taggers at first (This will depend on how much we can adopt the existing modules)
  ** 4. The first release would be available after we had incorporated one of the taggers.
   
  The guidelines on contributing to code will be made available on coming weeks. 
   
     anx, wDa, snb to all the kids of his Majesty out there,
       
       keep in touch,
       love & peace.
       
Ce projet est une ré-implémentation du projet de Michele Moglia sur lunchpad, voir: https://launchpad.net/pysesh

   Notre but dans ce projet est d'implémenter petit à petit certaines fonctionnes du Jsesh afin de traiter les textes égyptiens qui sont encodés en masse. Les points de répères sont en train de discuter avec M. Serge Rosmorduc, le développeur du Jsesh.
   Après nos discussions récentes avec M. Rosmorduc, on a décidé sur les points suivants:
   **Pysesh essaierait d'être un outil de tal pour l'Ancien Egyptien.
   **0.5: Créer un analyseur pour faciliter l'intéraction entre MdC et les types de Python.
   **1: Créer des modules pour préparer les signes saisies par Jsesh pour entrainer les taggers (on compte que cela ne prendrait pas beaucoup du temps)
   **2: Préparer quelques corpora pour entrainer les taggers (Cela va prendre du temps, parce que chaque signe et chaque usage du signe devraient être évalué)
   **3: 2 modèles: HMM et CRF seraient adopté comme tagger d'abord (Cela dependrait à tel point on peut adopter les modules existantes)
   **4: La première version serait disponible après qu'on a implementé l'un des taggers.
   
   Les indications générales pour contribuer au code seront consultables dans des sémaines prochaines.
   
    anx, wDa, snb aux tout-e-s les enfant-e-s de sa Majésté,
   
       Restez en contacte,
       l'amour & la paix.
       
 
 
 Bu proje Michele Moglia'nın lunchpad'deki projesinin yeniden uyarlanmasıdır, bkz: https://launchpad.net/pysesh
 
  Projedeki amacımız, yavaş yavaş Jsesh'teki bazı işlemleri kodlanmış eski mısırca metinleri toptan incelemeye tabi tutabilecek şekilde python'a uyarlamaktır. Projenin hedefleri M. Serge Rosmorduc, Jsesh'in geliştiricisi, ile görüşülmektedir.
  M.Rosmorduc ile temaslarımızdan sonra şunlarda karar kıldık:
  **Pysesh eski mısırca için bir doğal dil işleme birimi olmaya çalışacak.
  **0.5: MdC ile Python'un kendi tipleri arasındaki etkileşimi kolaylaştırmak için bir ayrıştırıcı yazılacak.
  **1: Etiketleyicileri eğitmek adına Jsesh tarafından girilmiş işaretleri hazırlamaya yönelik birimler yazılacak. (Bu herhalde çok sürmez)
  **2: Birkaç eser etiketleyicileri eğitmek için hazırlanacak ( Bu büyük olasılıkla bayağı sürecektir)
  **3: Etiketleyiciler için iki model düşünüldü: SMZ (Saklı Markov Zinciri) ve KRA (Koşullu Rastlantısal Alan). Önceliği bu ikisini pyseshe dahil etmeye vereceğiz.
  **4: İlk sürüm etiketleyicilerden birini dahil ettikten sonra yayımlanacak.
    
  Koda katkıda bulunmak için gerekli yol gösterici talimatlar önümüzdeki haftalarda belirtilecektir.
    
    anx, wDa, snb, Muavinin bütün çocuklarına,
    
      İrtibatta kalın,
      Sevgi & Barış.
