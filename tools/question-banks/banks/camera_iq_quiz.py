"""Image quality fundamentals quiz (translated from Portuguese).

The single-answer questions keep their original four options. Each true/false
set (statements I-IV, pick the right V/F sequence) becomes a "pick all that
apply" question whose options are the statements and whose answers are the
true ones.
"""
import json
import os
import sys

TAG = ["Camera & Image Quality"]

# Reuses materials of the camera bank (same key, URL and text), so the seed links
# the existing rows instead of adding new ones.
CAMERA_SEED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "apps", "api", "seeds",
                           "camera-image-quality.json")
with open(CAMERA_SEED) as f:
    CAMERA_MATERIALS = {m["key"]: m for m in json.load(f)["materials"]}
MATERIAL_KEYS = ["iqa", "subjective-vq", "jpeg", "artifacts", "webvision", "trichromacy", "checker", "chromatic-adapt",
                 "gestalt", "aliasing", "noise-red", "depth-perception", "dof", "dynamic-range", "ev", "tone-mapping",
                 "hdr"]

Q = []


def mc(prompt, difficulty, options, correct, explanation, materials):
    assert len(options) == 4 and 0 <= correct < 4
    Q.append({"type": "multiple-choice", "prompt": prompt, "tags": TAG, "difficulty": difficulty, "options": options,
              "correct": correct, "explanation": explanation, "materials": materials})


def pick(prompt, difficulty, statements, explanation, materials):
    """statements: (text, is_true) pairs, in the original I-IV order."""
    correct = [i for i, (_, ok) in enumerate(statements) if ok]
    assert 0 < len(correct) < len(statements)
    Q.append({"type": "multi-select", "prompt": prompt, "tags": TAG, "difficulty": difficulty,
              "options": [s for s, _ in statements], "correctIndices": correct, "explanation": explanation,
              "materials": materials})


mc("Which option best describes what image quality measures?", "easy",
   ["The level of compression applied to a file, measured as the ratio between the original and the compressed size.",
    "The degree of degradation an observer can perceive, such as the noise caused by a low radiation dose in CT scans.",
    "The ability of an algorithm to predict, automatically and quickly, the overall impression of quality without any human assessment.",
    "The amount of spatial information captured by the sensor, related to faithfully reproducing the shapes in the scene."],
   1,
   "Image quality is about perceptible degradation: how much worse the image looks to an observer, for example the noise "
   "from a low radiation dose in a CT scan. A compression ratio is a file property, automatic prediction is what objective "
   "metrics try to do (not what quality is), and spatial information is only one attribute (resolution and shape).",
   ["iqa"])

mc("Why is compressing an image to formats such as PNG or JPEG relevant to image quality assessment?", "easy",
   ["Because compression degrades the image data, and quality assessment is used to measure that kind of degradation.",
    "Because compression improves the image's perceived sharpness, bringing its quality closer to the original before conversion.",
    "Because compression is mainly about adjusting the image's dynamic range of colors, much like tone mapping.",
    "Because compression increases the image's spatial resolution, so more detail is stored in the final file."],
   0,
   "Lossy compression (JPEG) throws data away and introduces artifacts such as blocking and ringing, so measuring that "
   "degradation is a classic use of quality assessment. Compression never adds sharpness or resolution, and it isn't tone mapping.",
   ["jpeg", "artifacts", "iqa"])

pick("Which statements about subjective and objective image quality assessment are true? Pick all that apply.", "medium",
     [("Subjective assessment is done by people, or by perceptual models that consider higher-level aspects in the "
       "context of the region being viewed.", True),
      ("Objective assessment compares values with each other without taking the perception of the image as a whole "
       "into account.", True),
      ("The goal of image quality assessment is to provide metrics that predict perceived quality manually, with the "
       "help of many human raters.", False),
      ("Subjective and objective assessment share the goal of measuring the degree of image degradation, just by "
       "different routes.", True)],
     "Subjective assessment uses people (or perceptual models that imitate them, looking at context); objective assessment "
     "compares values, such as pixels or measurements, without judging the image as a whole. Both aim to measure degradation. "
     "The false statement is the 'manually' one: the point of quality metrics is to predict perceived quality "
     "automatically, so you don't need a panel of raters every time.",
     ["iqa", "subjective-vq"])

pick("Which statements about the definitions of image quality proposed by different authors are true? Pick all that apply.",
     "medium",
     [("One definition says image quality depends only on the resolution of the capture sensor, regardless of the "
       "viewing conditions.", False),
      ("One definition describes image quality as an integrated set of perceptions of the overall degree of excellence "
       "of the image, not just an isolated comparison of pixels.", True),
      ("Another defines image quality as the impression of its merit or excellence as perceived by an observer not "
       "involved in taking the photo or with its subject.", True),
      ("The definitions agree that image quality involves human perception, not only isolated technical measurements.", True)],
     "The definitions describe quality as an integrated perception of overall excellence, and (Keelan) as the impression "
     "of merit perceived by an observer neither involved in taking the picture nor with its subject. All of them put human "
     "perception at the center. None says quality depends only on sensor resolution; viewing conditions matter.",
     ["iqa"])

mc("From the point of view of visual perception, what is color?", "easy",
   ["What the visual system perceives from the physical properties of an object when it is struck by light, lit or "
    "emits light, as with the Sun and, by reflection, the Moon.",
    "A visual effect that tends to appear similarly across species, since most visual systems capture similar ranges of "
    "light wavelengths.",
    "A measure of the amount of light reflected by an object's surface, computed independently of the visual system that "
    "observes it.",
    "A property of the object that depends mainly on its chemical composition and surface texture, and is little "
    "influenced by the light falling on it."],
   0,
   "Color is a perception: what the visual system makes of light emitted by a source (the Sun) or reflected by an object "
   "(the Moon). It differs between species, which see different wavelength ranges, and it depends strongly on the "
   "illuminating light, so it isn't a fixed property of the object or a reflectance number independent of the observer.",
   ["webvision", "trichromacy"])

pick("Which statements about the light spectrum perceived by the human visual system (HVS) and by other animals are "
     "true? Pick all that apply.", "easy",
     [("The human visual system perceives electromagnetic waves roughly between 380 and 720 nanometers.", True),
      ("The light spectrum visible to humans is most of the total electromagnetic spectrum, including X-rays and "
       "gamma rays.", False),
      ("Snakes can sense infrared radiation and bees can see ultraviolet, ranges the human eye can't perceive.", True),
      ("Just past violet, toward shorter wavelengths, comes ultraviolet, followed by X-rays and gamma rays.", True)],
     "Human vision covers about 380 to 720 nm, a tiny slice of the electromagnetic spectrum. Beyond violet (shorter "
     "wavelengths) come ultraviolet, X-rays and gamma rays; beyond red, infrared. Some animals see outside our range: "
     "pit vipers sense infrared and bees see ultraviolet. The false statement claims the visible band is most of the spectrum.",
     ["webvision", "trichromacy"])

mc("Which option correctly describes the simultaneous contrast effect in color perception?", "easy",
   ["Color perception depends mainly on the physical properties of the pigment used, and has little to do with the "
    "surrounding visual context.",
    "The same color can be perceived differently depending on its surround or the colors around it, even when the color "
    "values are identical.",
    "The brain tends to adjust the perceived color of an object to reduce the difference caused by the surround.",
    "Two physically different colors tend to look alike when applied to similar geometric shapes."],
   1,
   "Simultaneous contrast: identical color values look different on different surrounds (a gray patch looks lighter on "
   "a dark background). The surround pushes the color away from itself, not toward it, and shape has nothing to do with it. "
   "Adelson's checker shadow illusion is a famous example.",
   ["checker", "webvision"])

mc("When a color filter is applied to only part of an image rather than the whole image, what usually happens to the "
   "viewer's chromatic adaptation?", "medium",
   ["It depends mainly on the amount of ambient light in the photographed scene, with little influence from the other "
    "colors in the image.",
    "It tends to keep colors distinguishable even when the filter covers only a small region of the image.",
    "It can be impaired when the filter covers only one region, making it harder to tell colors apart in that area.",
    "It is mainly related to the amount of texture detail in the region where the filter is applied."],
   2,
   "Chromatic adaptation works on the whole visual field: with a filter over the entire image the eye adapts and the "
   "colors look normal again after a moment. With the filter on only one region, the rest of the image anchors the "
   "adaptation, so the filtered area keeps its cast and colors there are harder to tell apart.",
   ["chromatic-adapt", "webvision"])

mc("What is the main difference between Biederman's and the Gestalt approaches to visual recognition?", "easy",
   ["Both say the whole and the parts are recognized at the same time, with no order of precedence.",
    "Biederman says the whole is perceived before the parts, while Gestalt says the parts are perceived before the whole.",
    "Biederman says the parts are perceived before the whole, while Gestalt argues for holistic perception of the whole "
    "before the parts are analyzed.",
    "Both say recognition happens only by analyzing the parts in isolation, without any perception of the whole."],
   2,
   "Biederman's recognition-by-components is bottom-up: objects are assembled from simple parts (geons). Gestalt "
   "psychology is holistic: the whole is perceived first and is more than the sum of its parts. Real vision mixes both.",
   ["gestalt"])

mc("How does a camera's resolution relate to how well it reproduces an object's shape?", "easy",
   ["Shape reproduction is determined mainly by the distance between object and camera, with little relation to the "
    "sensor's resolution.",
    "Low-resolution cameras tend to reproduce shape more faithfully, because each capture covers a larger area of the scene.",
    "Resolution has little influence on shape reproduction, which depends mainly on the texture of the object's surface.",
    "A low-resolution camera can confuse where object geometries intersect, while a higher-resolution camera reproduces "
    "the space more faithfully."],
   3,
   "Shape is carried by edges and boundaries. With too few pixels, edges where objects meet blur together or alias, so "
   "the geometry becomes ambiguous; more resolution samples those boundaries finely enough to reproduce the scene faithfully.",
   ["aliasing"])

pick("Which statements about texture and its importance in image quality assessment are true? Pick all that apply.",
     "medium",
     [("Texture can be defined as a variation inherent to a physical object, natural or synthetic, that the human visual "
       "system can distinguish.", True),
      ("Perceptible differences in texture and gloss can help tell natural objects from synthetic (artificial) ones.", True),
      ("Texture lets you interpret an object's properties by sight alone, helping recognize the object as a whole.", True),
      ("Texture can only be perceived on surfaces with obvious relief; flatter areas show no perceptible variation.", False)],
     "Texture is the fine, characteristic variation of a surface, natural or synthetic, that we can distinguish. Texture "
     "and gloss help tell natural from artificial materials and let us infer properties (rough, soft, wet) just by looking. "
     "Flat surfaces have texture too, in color and reflectance variation, which is why denoising that removes it makes "
     "skin or fabric look waxy.",
     ["noise-red", "iqa"])

mc("What usually happens when a texture-smoothing filter is applied to a photo in post-processing, even when the "
   "original image has no noise?", "easy",
   ["Texture filtering in these cases usually aims to bring out fine detail in skin and hair, making it sharper and more realistic.",
    "The waxy look in these cases comes mainly from the low bit depth used at capture, not from texture processing.",
    "Texture filtering can lower image quality, producing blur and a 'waxy' look on skin, hair and clothing.",
    "Texture filtering tends to improve perceived quality, making the image look sharper after processing."],
   2,
   "Smoothing filters can't tell fine texture from noise, so they erase it even when there is no noise to remove. The "
   "result is blur and a waxy, plastic look on skin, hair and fabric, which lowers perceived quality.",
   ["noise-red"])

pick("Which statements about the need for objective metrics when handling large volumes of images are true? Pick all "
     "that apply.", "medium",
     [("Comparing a top-quality camera with mobile devices shows that objective metrics are unnecessary when the cameras' "
       "quality differs a lot.", False),
      ("Automating quality assessment is essential when handling large volumes of images, such as 100,000 or 200,000.", True),
      ("Purely subjective assessment becomes unfeasible with large volumes of images.", True),
      ("The importance of objective metrics here is related to the need to compare the quality of images from different "
       "sensors.", True)],
     "People can't rate hundreds of thousands of images, so large volumes need automated, objective metrics; they also "
     "make images from different sensors comparable on the same scale. An obvious quality gap between a top camera and a "
     "phone doesn't make metrics unnecessary: you still need numbers to compare and track devices.",
     ["iqa", "subjective-vq"])

pick("Which statements about the visual cues that let you infer depth in an image are true? Pick all that apply.", "medium",
     [("Interposition, one of the depth cues, happens when one object is in front of another and hides part of it.", True),
      ("Shading is a depth cue closely tied to lighting, which lets you infer that objects are at different positions.", True),
      ("Retinal size and familiarity explain why a nearby ant can look bigger than a truck in the background, even though "
       "we know the truck is physically bigger.", True),
      ("Linear perspective refers to the variation in color seen between objects at different distances from the "
       "viewer.", False)],
     "Interposition (occlusion), shading and retinal size combined with familiar size are all monocular depth cues: a "
     "close ant can fill more of the retina than a distant truck, and knowing their real sizes tells us which is farther. "
     "Linear perspective is about parallel lines converging with distance; the color and contrast change with distance is "
     "aerial (atmospheric) perspective.",
     ["depth-perception"])

mc("Which option best defines the parallax effect?", "easy",
   ["The difference in apparent motion of objects at different distances when the viewer changes viewpoint, which "
    "contributes to the impression of depth.",
    "One object overlapping another, which lets the viewer infer which of the two is closer to the camera.",
    "The change in the intensity of light reflected by an object's surface as the viewing angle relative to the light "
    "source changes.",
    "The loss of sharpness in distant objects caused by atmospheric scattering, making colors and outlines less defined "
    "with distance."],
   0,
   "Motion parallax: when the viewpoint moves, near objects shift more than far ones, and that difference signals depth. "
   "The other options describe other cues: interposition (overlap), shading or specular reflection, and aerial perspective.",
   ["depth-perception"])

pick("Which statements about depth as an aspect of image quality are true? Pick all that apply.", "medium",
     [("Depth is considered crucial to how an observer relates to objects in the three-dimensional world.", True),
      ("Being able to tell that one object doesn't belong to another, or that one part of an object is farther away than "
       "another, depends on understanding depth.", True),
      ("Depth can only be perceived in three-dimensional (stereoscopic) images; it can't be conveyed in an ordinary "
       "two-dimensional photo.", False),
      ("Depth can be inferred in an image from cues such as focus, blur and capture distortions.", True)],
     "Depth is how we relate to a 3D world and separate objects and their parts. A flat photo still conveys depth through "
     "monocular cues (occlusion, shading, perspective, focus and blur, distortion), so stereoscopy isn't required.",
     ["depth-perception", "dof"])

pick("Which statements about absolute luminance and luminance range are true? Pick all that apply.", "medium",
     [("Absolute luminance is the total amount of light captured by the observer, human or camera.", True),
      ("Luminance range describes the span of different luminances that can be captured, not the total amount of light.", True),
      ("Overexposure causes low absolute luminance, making details hard to see for lack of light.", False),
      ("Insufficient lighting can make the scene's content impossible to determine, because too little light is captured "
       "to reveal what the objects emit or reflect.", True)],
     "Absolute luminance is how much light is captured; luminance (dynamic) range is the span between the darkest and "
     "brightest levels that can be captured. Too little light leaves content undeterminable. Overexposure is the opposite "
     "of the false statement: too much light, which clips highlights and loses detail there.",
     ["dynamic-range", "ev"])

pick("Which statements about tone mapping are true? Pick all that apply.", "hard",
     [("Tone mapping adjusts an image's tones and contrast to make it better suited to display on devices with a reduced "
       "dynamic range.", True),
      ("Tone mapping is related to the behavior of the capture device, since a low-cost camera doesn't offer such a wide "
       "dynamic range of luminance.", True),
      ("In practice, tone mapping is done from a single image captured with automatic exposure, without combining "
       "different exposures.", False),
      ("Tone mapping is related to HDR (High Dynamic Range), although not directly: the methods depend on each other "
       "conceptually.", True)],
     "Tone mapping compresses a wide luminance range into what a display (or a limited camera pipeline) can show, while "
     "keeping contrast and detail. It's tied to HDR: typically several exposures are merged into an HDR image and then "
     "tone mapped, so it isn't limited to a single auto-exposed shot.",
     ["tone-mapping", "hdr"])

assert len(Q) == 18, len(Q)
used = {k for q in Q for k in q["materials"]}
assert used == set(MATERIAL_KEYS), set(MATERIAL_KEYS) ^ used
prompts = [q["prompt"] for q in Q]
assert len(prompts) == len(set(prompts))

mats = [CAMERA_MATERIALS[k] for k in MATERIAL_KEYS]
with open(sys.argv[1], "w") as f:
    json.dump({"name": "Image quality fundamentals quiz", "materials": mats, "questions": Q}, f, indent=2,
              ensure_ascii=False)
print(f"Image quality fundamentals quiz: {len(Q)} questions "
      f"({sum(q['type'] == 'multi-select' for q in Q)} pick all that apply), {len(mats)} materials")
